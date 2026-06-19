import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// #region agent log
window.assistantContext = {
  currentPage: "",
  pageData: {}
};

window.addEventListener("error", (event) => {
  fetch("http://127.0.0.1:7589/ingest/7d431922-f103-452a-8045-35deb37a60c8", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1666b2" },
    body: JSON.stringify({
      sessionId: "1666b2",
      runId: "initial",
      hypothesisId: "H1",
      location: "src/main.tsx:4",
      message: "window error event",
      data: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error instanceof Error ? event.error.stack : undefined,
        href: window.location.href,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
});

window.addEventListener("unhandledrejection", (event) => {
  fetch("http://127.0.0.1:7589/ingest/7d431922-f103-452a-8045-35deb37a60c8", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1666b2" },
    body: JSON.stringify({
      sessionId: "1666b2",
      runId: "initial",
      hypothesisId: "H1",
      location: "src/main.tsx:20",
      message: "unhandled promise rejection",
      data: { reason: String(event.reason) },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
});
// #endregion

createRoot(document.getElementById("root")!).render(<App />);
