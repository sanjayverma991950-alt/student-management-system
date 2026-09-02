const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');

// Initialize Gemini API client if API key is provided
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (error) {
    console.error('Failed to initialize GoogleGenerativeAI:', error.message);
  }
}

// Helper to calculate statistics
const getStudentStats = async (studentId) => {
  const grades = await Grade.find({ student: studentId }).populate('course', 'name code');
  const attendance = await Attendance.find({ student: studentId }).populate('course', 'name code');

  // Course wise grades and attendance
  const courseStats = {};

  grades.forEach(g => {
    const cid = g.course._id.toString();
    if (!courseStats[cid]) {
      courseStats[cid] = { name: g.course.name, code: g.course.code, grades: [], attendance: { present: 0, total: 0 } };
    }
    courseStats[cid].grades.push({
      title: g.title,
      score: (g.marksObtained / g.maxMarks) * 100,
      marks: `${g.marksObtained}/${g.maxMarks}`
    });
  });

  attendance.forEach(a => {
    const cid = a.course._id.toString();
    if (!courseStats[cid]) {
      courseStats[cid] = { name: a.course.name, code: a.course.code, grades: [], attendance: { present: 0, total: 0 } };
    }
    courseStats[cid].attendance.total += 1;
    if (a.status === 'Present' || a.status === 'Late') {
      courseStats[cid].attendance.present += 1;
    }
  });

  // Calculate final details
  let totalGradeSum = 0;
  let totalGradeCount = 0;
  let totalAttendancePresent = 0;
  let totalAttendanceTotal = 0;

  const coursesList = Object.keys(courseStats).map(cid => {
    const course = courseStats[cid];
    const avgGrade = course.grades.length > 0 
      ? course.grades.reduce((sum, item) => sum + item.score, 0) / course.grades.length 
      : null;
    
    const attendanceRate = course.attendance.total > 0
      ? (course.attendance.present / course.attendance.total) * 100
      : null;

    if (avgGrade !== null) {
      totalGradeSum += avgGrade;
      totalGradeCount += 1;
    }
    if (attendanceRate !== null) {
      totalAttendancePresent += course.attendance.present;
      totalAttendanceTotal += course.attendance.total;
    }

    return {
      courseId: cid,
      name: course.name,
      code: course.code,
      averageGrade: avgGrade !== null ? Math.round(avgGrade) : 'No grades',
      attendanceRate: attendanceRate !== null ? Math.round(attendanceRate) : 'No records',
      gradesRaw: course.grades
    };
  });

  const overallAvgGrade = totalGradeCount > 0 ? Math.round(totalGradeSum / totalGradeCount) : null;
  const overallAttendance = totalAttendanceTotal > 0 ? Math.round((totalAttendancePresent / totalAttendanceTotal) * 100) : null;

  return {
    coursesList,
    overallAvgGrade,
    overallAttendance
  };
};

// @desc    Analyze student academic and attendance performance using AI
// @route   POST /api/ai/analyze/:studentId
// @access  Private (Admin, Teacher)
const analyzePerformance = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({ user: studentId });
    const { coursesList, overallAvgGrade, overallAttendance } = await getStudentStats(studentId);

    // If stats are empty, write a placeholder analysis
    if (coursesList.length === 0) {
      return res.status(200).json({
        success: true,
        data: `### AI Performance Analysis for **${student.name}**\n\nNo academic records, grades, or attendance logs were found in the database for this student. Please add courses, enroll the student, and input grades or attendance to generate a comprehensive analysis.`
      });
    }

    // Construct the context text block
    let context = `Student Name: ${student.name}\n`;
    context += `Roll Number: ${profile ? profile.rollNumber : 'N/A'}\n`;
    context += `Overall Grade Average: ${overallAvgGrade !== null ? overallAvgGrade + '%' : 'N/A'}\n`;
    context += `Overall Attendance Rate: ${overallAttendance !== null ? overallAttendance + '%' : 'N/A'}\n\n`;
    context += `Course breakdown:\n`;
    
    coursesList.forEach(course => {
      context += `- Course: ${course.name} (${course.code})\n`;
      context += `  Average Grade: ${course.averageGrade}%\n`;
      context += `  Attendance: ${course.attendanceRate}%\n`;
      if (course.gradesRaw.length > 0) {
        context += `  Assessments:\n`;
        course.gradesRaw.forEach(g => {
          context += `    * ${g.title}: score ${Math.round(g.score)}% (marks ${g.marks})\n`;
        });
      }
    });

    // Check if Gemini API is available, otherwise run mock generator
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
          You are an expert Educational Data Analyst and Academic Advisor.
          Analyze the following student data and generate a clear, formatted Markdown report.
          The report should include:
          1. **Executive Summary**: A brief evaluation of the student's status (Excellent, Satisfactory, or At Risk).
          2. **Strengths**: Specific subjects or areas where the student is excelling.
          3. **Areas for Improvement**: Highlight subjects with low attendance (<75%) or grades (<60%).
          4. **Actionable Suggestions**: 3-4 specific, personalized study recommendations for the student.
          5. **Teacher Note**: A direct recommendation for the teacher on how to assist this student.

          Student Performance Data:
          ${context}

          Response formatting guidelines:
          - Use clear Markdown headings, bullet points, and tables if necessary.
          - Write in a professional, constructive, and supportive tone.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ success: true, data: text });
      } catch (err) {
        console.error('Gemini API Error:', err.message);
        // Fall through to mock engine if API request fails
      }
    }

    // Mock Fallback Engine (Runs when API Key is missing or fails)
    const isAtRisk = (overallAvgGrade !== null && overallAvgGrade < 60) || (overallAttendance !== null && overallAttendance < 75);
    const riskStatus = isAtRisk ? '⚠️ AT RISK' : (overallAvgGrade >= 85 ? '🌟 EXCELLENT' : '✅ SATISFACTORY');

    let mockReport = `### AI Performance Analysis for **${student.name}** *(Mock Engine Fallback)*\n\n`;
    mockReport += `> **Note**: Gemini API Key is missing or invalid. Displaying a rules-based analysis report.\n\n`;
    mockReport += `#### 1. Executive Summary\n`;
    mockReport += `- **Academic Standing**: **${riskStatus}**\n`;
    mockReport += `- **Overall Grade Average**: ${overallAvgGrade !== null ? overallAvgGrade + '%' : 'N/A'}\n`;
    mockReport += `- **Overall Attendance Rate**: ${overallAttendance !== null ? overallAttendance + '%' : 'N/A'}\n\n`;

    mockReport += `#### 2. Strengths & Progress\n`;
    const strengths = coursesList.filter(c => typeof c.averageGrade === 'number' && c.averageGrade >= 80);
    if (strengths.length > 0) {
      strengths.forEach(c => {
        mockReport += `- Excelled in **${c.name} (${c.code})** with an average grade of **${c.averageGrade}%**.\n`;
      });
    } else {
      mockReport += `- Shows steady participation across all registered modules.\n`;
    }

    mockReport += `\n#### 3. Areas for Improvement\n`;
    let improvements = false;
    coursesList.forEach(c => {
      if (typeof c.averageGrade === 'number' && c.averageGrade < 60) {
        mockReport += `- **Grade Alert**: Average grade in **${c.name}** is **${c.averageGrade}%** (Below passing benchmark).\n`;
        improvements = true;
      }
      if (typeof c.attendanceRate === 'number' && c.attendanceRate < 75) {
        mockReport += `- **Attendance Alert**: Attendance in **${c.name}** is **${c.attendanceRate}%** (Requires attention to avoid penalty).\n`;
        improvements = true;
      }
    });
    if (!improvements) {
      mockReport += `- No urgent academic or attendance warnings. Keep up the good work!\n`;
    }

    mockReport += `\n#### 4. Actionable Suggestions\n`;
    if (isAtRisk) {
      mockReport += `1. **Improve Attendance**: Focus on attending all remaining lectures for classes below 75%.\n`;
      mockReport += `2. **Peer Study groups**: Team up with classmates for revision of difficult concepts.\n`;
      mockReport += `3. **Remedial Practice**: Ask teachers for extra problem sheets or exercises in lower-scoring courses.\n`;
    } else {
      mockReport += `1. **Advanced Practice**: Take on additional projects or write case studies to deepen practical understanding.\n`;
      mockReport += `2. **Peer Mentoring**: Help other struggling students to reinforce core principles.\n`;
      mockReport += `3. **Consistent Revision**: Review weekly lecture materials to maintain high grade outputs.\n`;
    }

    mockReport += `\n#### 5. Guidance Note for Teachers\n`;
    if (isAtRisk) {
      mockReport += `* **Action Required**: Schedule a quick one-on-one session to discuss hurdles student is facing, check attendance logs, and provide guidance on assignments.*`;
    } else {
      mockReport += `* **Action Required**: Encourage student to lead class assignments or support them in advanced study routes.*`;
    }

    res.status(200).json({ success: true, data: mockReport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    AI Study Buddy Chat assistant
// @route   POST /api/ai/chat
// @access  Private
const chatStudyBuddy = async (req, res) => {
  const { message, courseId, contextType } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Please provide a message' });
  }

  try {
    let courseContext = '';
    if (courseId) {
      const course = await Course.findById(courseId);
      if (course) {
        courseContext = `Currently, the student is studying the course: "${course.name}" (Course Code: ${course.code}).\nDescription: ${course.description || 'No description provided'}.\n`;
      }
    }

    // Set custom prompts for context modes
    let systemInstruction = 'You are a friendly, highly intelligent AI Study Buddy chatbot integrated into a Student Management System. You help students understand their subjects, explain concepts, build study plans, and generate short practice quizzes. Always structure your responses using clear Markdown (e.g. bold terms, lists, tables). Keep responses educational, encouraging, and focused on helping the student learn.';

    let targetPrompt = message;

    if (contextType === 'explain') {
      targetPrompt = `Explain the following topic or concept simply, with examples:\n"${message}"`;
    } else if (contextType === 'quiz') {
      targetPrompt = `Generate a 3-question Multiple Choice Quiz on the topic:\n"${message}"\nInclude options A, B, C, D for each question. Place the correct answers and brief explanations in a collapsed/spoilered block at the bottom using HTML '<details><summary>Click to show answers</summary>...</details>' tags.`;
    } else if (contextType === 'study-plan') {
      targetPrompt = `Create a detailed 7-day study plan to master this topic or subject area:\n"${message}"\nProvide estimated study times and specific goals for each day.`;
    }

    const fullPrompt = `${courseContext}\nUser Request: ${targetPrompt}`;

    // If Gemini is active
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemInstruction,
        });

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ success: true, data: text });
      } catch (err) {
        console.error('Gemini Chat API Error:', err.message);
      }
    }

    // Rule-based Fallback if API key is not supplied
    let mockReply = `### AI Study Buddy *(Mock Response)*\n\n`;
    mockReply += `> **Setup Notice**: Gemini API Key is missing. Below is a mock response demonstrating the **${contextType || 'general'}** response format.\n\n`;

    if (contextType === 'explain') {
      mockReply += `#### Concept Explanation: "${message}"\n\n`;
      mockReply += `Here is a simplified explanation:\n`;
      mockReply += `1. **Core Principle**: Think of it as a set of rules where each action triggers a reaction. If you do Action A, state is updated. \n`;
      mockReply += `2. **Real-world Example**: In real life, it works like a vending machine. You input money (state change), select items (operation), and get snacks (output).\n`;
      mockReply += `3. **Key Terminology**:\n`;
      mockReply += `   - *State*: Current condition/properties of system.\n`;
      mockReply += `   - *Reducer/Controller*: Receives input and updates current conditions.\n\n`;
      mockReply += `*Pro Tip: Try drawing a flow diagram to map it out!*`;
    } else if (contextType === 'quiz') {
      mockReply += `#### Practice Quiz: "${message}"\n\n`;
      mockReply += `**Q1. Which of the following is true regarding this topic?**\n`;
      mockReply += `- A) It is only used in backend programming\n`;
      mockReply += `- B) It helps model relationships between database entities\n`;
      mockReply += `- C) It is a styling utility\n`;
      mockReply += `- D) None of the above\n\n`;
      mockReply += `**Q2. What is a key benefit of practicing this concept?**\n`;
      mockReply += `- A) Faster load times\n`;
      mockReply += `- B) Better data normalization\n`;
      mockReply += `- C) Modular, readable and cleaner system flow\n`;
      mockReply += `- D) Automatic styling sheets\n\n`;
      mockReply += `<details>\n<summary>Click to show answers</summary>\n\n**Answers:**\n1. **B** - It is typically used to represent database schemas and structural records.\n2. **C** - It provides modular architecture and clean code pathways.\n</details>`;
    } else if (contextType === 'study-plan') {
      mockReply += `#### 7-Day Study Plan for: "${message}"\n\n`;
      mockReply += `| Day | Target Topic | Time | Daily Activity |\n`;
      mockReply += `| --- | --- | --- | --- |\n`;
      mockReply += `| Day 1-2 | Fundamentals & Syntax | 1.5 hours | Read docs and copy standard code snippets |\n`;
      mockReply += `| Day 3-4 | Core Integrations | 2 hours | Implement small endpoints or models manually |\n`;
      mockReply += `| Day 5-6 | Error handling & Edge cases | 1.5 hours | Test invalid inputs, write validations |\n`;
      mockReply += `| Day 7 | Project Build | 3 hours | Combine parts into a functional repository |\n`;
    } else {
      mockReply += `Hello there! I'm your AI Study Buddy. Currently, my connections are offline (missing Gemini API Key), but I'm ready to receive academic requests.\n\n`;
      mockReply += `You asked: *"${message}"*\n\n`;
      mockReply += `Try using the **Explain Topic**, **Quiz Me**, or **Study Plan** shortcuts on the left for tailored educational outputs!`;
    }

    res.status(200).json({ success: true, data: mockReply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  analyzePerformance,
  chatStudyBuddy,
};
