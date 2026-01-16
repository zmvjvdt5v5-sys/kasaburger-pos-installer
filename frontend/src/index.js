import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// CRITICAL: Suppress postMessage cloning errors at the earliest point
window.onerror = function(msg, url, line, col, error) {
  if (msg && (msg.includes('postMessage') || msg.includes('cloned') || msg.includes('Request object'))) {
    return true; // Suppress the error
  }
  return false;
};

window.addEventListener('error', function(e) {
  if (e.message && (e.message.includes('postMessage') || e.message.includes('cloned') || e.message.includes('Request object'))) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}, true);

window.addEventListener('unhandledrejection', function(e) {
  if (e.reason && e.reason.message && (e.reason.message.includes('postMessage') || e.reason.message.includes('cloned'))) {
    e.preventDefault();
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
