import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../modules/auth";
import { MainLayout } from "../shared/layout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage, RegisterPage, DashboardPage, NotFoundPage, TasksPage, TaskDetailPage, BoardsPage, BoardDetailPage } from "../pages";
import { Loading } from "../shared/ui";

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading message="Loading..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
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

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <MainLayout>
                <TasksPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/:taskId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <TaskDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/boards"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BoardsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/boards/:boardId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <BoardDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900">Team</h1>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
