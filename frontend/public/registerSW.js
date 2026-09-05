if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (var r of registrations) {
      r.unregister();
    }
  });
}
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (var name of names) {
      caches.delete(name);
    }
  });
}
