import { createRoot } from "react-dom/client";
import App from "./App";
import TestApp from "./TestApp";
import "./index.css";

console.log("Loading Document Chat main.tsx...");

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
} else {
  console.log("Root element found, creating React app...");
  try {
    const root = createRoot(rootElement);
    
    // Temporarily use TestApp for debugging
    const useTestApp = window.location.search.includes('test=true');
    
    if (useTestApp) {
      console.log("Using TestApp for debugging...");
      root.render(<TestApp />);
    } else {
      console.log("Using main App...");
      root.render(<App />);
    }
    
    console.log("React app rendered successfully!");
  } catch (error) {
    console.error("Error rendering React app:", error);
    // Fallback to test app on error
    const root = createRoot(rootElement);
    root.render(<TestApp />);
  }
}
