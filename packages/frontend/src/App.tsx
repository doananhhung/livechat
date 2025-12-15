import { Routes, Route, Navigate } from "react-router-dom";
import type { JSX } from "react";
import { useEffect, useState } from "react";

// --- Core Components & Pages ---
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import Verify2faPage from "./pages/auth/Verify2faPage";
import { Toaster } from "./components/ui/Toaster";
import { SettingsLayout } from "./pages/settings/SettingsLayout";
import { ProfilePage } from "./pages/settings/ProfilePage";
import { SecurityPage } from "./pages/settings/SecurityPage";
import { ProjectSettingsPage } from "./pages/settings/ProjectSettingsPage";
import { useAuthStore } from "./stores/authStore";
import { Spinner } from "./components/ui/Spinner";

// --- The New Inbox Structure ---
import { InboxLayout } from "./pages/inbox/InboxLayout";
import { MainLayout } from "./components/layout/MainLayout";
import { MessagePane } from "./components/features/inbox/MessagePane";
import { AuthCallbackPage } from "./pages/auth/AuthCallbackPage";

/**
 * PublicRoute HOC for better auth flow.
 * Automatically redirects authenticated users from public pages.
 */
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // UPDATED: Redirect to /inbox, not /dashboard
  return isAuthenticated ? <Navigate to="/inbox" replace /> : children;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const verifySessionAndFetchUser = useAuthStore(
    (state) => state.verifySessionAndFetchUser
  );

  useEffect(() => {
    const verifySession = async () => {
      try {
        await verifySessionAndFetchUser();
      } catch (error) {
        // Error is handled in the store, which will log out the user
        // or handle 2FA redirection.
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [verifySessionAndFetchUser]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* === Public Routes with Guard === */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route path="/verify-2fa" element={<Verify2faPage />} />

        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* === Protected Routes === */}

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/inbox">
            <Route index element={<InboxLayout />} />

            <Route path="projects/:projectId" element={<InboxLayout />}>
              <Route
                path="conversations/:conversationId"
                element={<MessagePane />}
              />
            </Route>
          </Route>

          {/* Settings Area is now a child of MainLayout */}
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="projects" element={<ProjectSettingsPage />} />
          </Route>
        </Route>
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>

      <Toaster />
    </>
  );
}

export default App;
