import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MonitorPage from "./pages/MonitorPage";
import AnalyticsPage from "./pages/AnalyticsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/monitor" replace />} />
        <Route path="/monitor" element={<MonitorPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<div className="p-6">404 — Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
