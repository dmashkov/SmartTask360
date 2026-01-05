import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../modules/auth";
import { MainLayout } from "../shared/layout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage, RegisterPage, DashboardPage, NotFoundPage, TasksPage, TaskDetailPage, BoardsPage, BoardDetailPage, ProjectsPage, ProjectDetailPage, InboxPage, FavoritesPage } from "../pages";
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
        {/* Personal Cabinet routes */}
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <MainLayout>
                <InboxPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <MainLayout>
                <FavoritesPage />
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
          path="/projects"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProjectsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProjectDetailPage />
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
                  <h1 className="text-2xl font-bold text-gray-900">Документы</h1>
                  <p className="text-gray-600 mt-2">В разработке...</p>
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
                  <h1 className="text-2xl font-bold text-gray-900">Команда</h1>
                  <p className="text-gray-600 mt-2">В разработке...</p>
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
                  <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
                  <p className="text-gray-600 mt-2">В разработке...</p>
                </div>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900">Отчёты</h1>
                  <p className="text-gray-600 mt-2">Функционал будет доступен в Phase 2</p>
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
