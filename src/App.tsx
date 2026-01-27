import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeProvider";
import AppLayout from "./components/layout/AppLayout";
import MonitorPage from "./pages/MonitorPage";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./components/errors/ErrorBoundary";
import NotFoundPage from "./pages/NotFoundPage";

const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));

function PageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      Loading…
    </div>
  );
}

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
              <Route
                path="/analytics"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <AnalyticsPage />
                  </Suspense>
                }
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
