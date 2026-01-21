import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeProvider";
import AppLayout from "./components/layout/AppLayout";
import MonitorPage from "./pages/MonitorPage";
import AnalyticsPage from "./pages/AnalyticsPage";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/monitor" replace />} />
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          <Route
            path="*"
            element={
              <div className="p-6 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                404 — Not Found
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
