# Student Management System with AI Features (MERN Stack)

This is a full-stack Student Management System built using the MERN stack (MongoDB, Express, React, Node.js) and integrated with Google Gemini AI for advanced educational insights and interactive tools.

## Key Features

1. **Role-Based Authentication**: Custom access and UI workflows for **Admins**, **Teachers**, and **Students**.
2. **AI Study Buddy Chatbot (Student)**: Contextual assistant to explain complex concepts, generate custom revision quizzes, and design personalized 7-day study plans.
3. **AI Performance Insights (Teacher/Admin)**: Scan a student's database metrics (exam marks, test history, daily attendance logs) to compile professional reports detailing academic standings, core strengths, warnings, and recommended instructor guidance.
4. **Attendance Tracker**: Bulk-attendance checker log sheet for teachers and attendance statistics trackers for students.
5. **Grades Book**: Easy-to-use grade portal allowing instructors to save scores and write comments.
6. **Robust Mock Engine**: Functions out of the box using a rules-based fallback logic if the Gemini API Key is not set.

---

## Technical Stack

- **Backend**: Node.js + Express.js + Mongoose + JWT Auth + Gemini Generative AI SDK
- **Frontend**: React + Vite + Tailwind CSS + Lucide Icons + Axios
- **Database**: MongoDB

---

## Quick Start Guide

### Prerequisites
- Node.js installed (v16+)
- MongoDB running locally (default: `mongodb://localhost:27017`) or a Mongo Atlas URI.

### 1. Setup Backend Environment
Navigate to the `backend/` directory:
- Create a `.env` file (or duplicate `.env.example`).
- Add your MongoDB connection string (e.g. `MONGODB_URI=mongodb://localhost:27017/student-management-system`).
- Specify a JWT token secret.
- **Optional (highly recommended)**: Enter your `GEMINI_API_KEY` to enable Google's Gemini models. (If left blank, the app will run in rules-based mock fallback mode).

### 2. Install and Run the Backend
From the project root:
```bash
cd backend
npm install
npm run dev
```
The server will boot on `http://localhost:5000`.

### 3. Install and Run the Frontend
From the project root in a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Vite will host the frontend application at `http://localhost:3000`.

---

## Evaluating & Testing the Demo Accounts

For easy navigation and testing, the application includes a **Quick Demo Access** dashboard. Follow these simple steps:

1. Visit the portal login page at `http://localhost:3000/login`.
2. Click the **"Initialize Demo Database / Seed Data"** link at the bottom of the card. This registers our accounts and seeds courses, attendance lists, and marks.
3. Click any of the Quick Demo buttons to log in instantly:
   - **Admin User**: `admin@school.com` / `admin123`
   - **Teacher User**: `teacher@school.com` / `teacher123`
   - **Student User**: `student@school.com` / `student123`

---

## Directory Architecture

```text
├── backend/
│   ├── config/          # DB connections
│   ├── models/          # Mongoose collections (User, Profile, Course, Attendance, Grade)
│   ├── controllers/     # Express route handlers & Gemini prompting logic
│   ├── middleware/      # Auth & role checkers
│   └── routes/          # API endpoint router bindings
└── frontend/
    ├── src/
    │   ├── context/     # Auth Context state handlers
    │   ├── components/  # Page shell & PrivateRoute guards
    │   └── pages/       # Login, Dashboard, Student List, Course Admin, AI Assistant, etc.
```
