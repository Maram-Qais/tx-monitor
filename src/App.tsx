import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeProvider";
import AppLayout from "./components/layout/AppLayout";
import MonitorPage from "./pages/MonitorPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./components/errors/ErrorBoundary";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <ThemeProvider>
        <ErrorBoundary>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          className:
            "border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
        }}
      />

      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/monitor" replace />} />
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

       <Route path="*" element={<NotFoundPage />} />

        </Routes>
        </BrowserRouter>
        </ErrorBoundary>
    </ThemeProvider>
  );
}
