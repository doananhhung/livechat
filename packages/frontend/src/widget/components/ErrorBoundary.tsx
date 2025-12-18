// src/widget/components/ErrorBoundary.tsx
import { Component } from "preact";

interface ErrorBoundaryProps {
  children?: any;
  fallback?: any;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle errors in the widget
 * Prevents the entire widget from crashing when a component error occurs
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error details (only in development)
    if (import.meta.env.DEV) {
      console.error("Widget Error Boundary caught an error:", error, errorInfo);
    }

    // You can also send error to logging service here
    // e.g., Sentry, LogRocket, etc.
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided, otherwise default error message
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#fee",
            color: "#c33",
            padding: "16px 20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "14px",
            maxWidth: "320px",
            zIndex: 9999,
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "8px" }}>
            Chat Widget Error
          </div>
          <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
            Something went wrong. Please refresh the page or contact support if
            the issue persists.
          </div>
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: "12px", fontSize: "12px" }}>
              <summary style={{ cursor: "pointer", fontWeight: "500" }}>
                Error details
              </summary>
              <pre
                style={{
                  marginTop: "8px",
                  padding: "8px",
                  backgroundColor: "#fff",
                  borderRadius: "4px",
                  overflow: "auto",
                  maxHeight: "200px",
                }}
              >
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
