import { useLocation } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";

export default function RouteErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
}
