import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { JSX } from "react";
import { useEffect, useState } from "react";

// --- Core Components & Pages ---
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ResendVerificationPage from "./pages/auth/ResendVerificationPage";
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

// --- Invitation Pages ---
import AcceptInvitationPage from "./pages/invitations/AcceptInvitationPage";
import InviteMembersPage from "./pages/invitations/InviteMembersPage";

/**
 * PublicRoute HOC for better auth flow.
 * Automatically redirects authenticated users from public pages.
 * EXCEPTION: If accessing /register with invitation_token, allow through
 * so RegisterPage can redirect to /accept-invitation
 */
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  // Allow authenticated users to access /register if they have an invitation token
  // The RegisterPage will handle redirecting them to /accept-invitation
  if (
    isAuthenticated &&
    location.pathname === "/register" &&
    location.search.includes("invitation_token=")
  ) {
    console.log(
      "[PublicRoute] Allowing authenticated user to access register page with invitation token"
    );
    return children;
  }

  // Otherwise, redirect authenticated users to inbox
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
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          path="/resend-verification"
          element={<ResendVerificationPage />}
        />
        <Route path="/verify-2fa" element={<Verify2faPage />} />

        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Accept invitation can be accessed by both authenticated and unauthenticated users */}
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

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

          {/* Invitation management (protected) */}
          <Route
            path="/projects/:projectId/invite"
            element={<InviteMembersPage />}
          />
        </Route>
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>

      <Toaster />
    </>
  );
}

export default App;
