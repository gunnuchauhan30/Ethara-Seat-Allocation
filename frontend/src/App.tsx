import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "./components/Toast";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Employees } from "./pages/Employees";
import { EmployeeDetail } from "./pages/EmployeeDetail";
import { Seats } from "./pages/Seats";
import { Projects } from "./pages/Projects";
import { ProjectDetail } from "./pages/ProjectDetail";
import { NewJoiner } from "./pages/NewJoiner";
import { AIAssistant } from "./pages/AIAssistant";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/employees/:id" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
            <Route path="/seats" element={<ProtectedRoute><Seats /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/new-joiner" element={<ProtectedRoute><NewJoiner /></ProtectedRoute>} />
            <Route path="/assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
