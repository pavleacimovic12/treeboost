import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Chat from "@/pages/chat";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Chat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log("App component rendering...");
  
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error("Error in App component:", error);
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
        <h1 style={{ color: '#1e40af', fontSize: '28px', marginBottom: '16px' }}>🧠 NeuralDoc</h1>
        <h2 style={{ color: '#374151', fontSize: '18px', fontWeight: 'normal' }}>Enterprise Document Intelligence Platform</h2>
        <p style={{ color: '#dc2626', marginTop: '20px' }}>Error loading application. Please check console for details.</p>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Error: {String(error)}</p>
      </div>
    );
  }
}

export default App;
