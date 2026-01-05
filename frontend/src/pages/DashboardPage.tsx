/**
 * SmartTask360 — Dashboard Page
 *
 * Main dashboard showing user statistics and recent tasks.
 */

import { Link } from "react-router-dom";
import { useAuth } from "../modules/auth";
import { useTasks } from "../modules/tasks";
import { useProjects } from "../modules/projects";
import { Card, CardHeader, CardTitle, CardContent, Badge, Spinner } from "../shared/ui";

// Stat card component
function StatCard({
  title,
  value,
  icon,
  color,
  link,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "yellow" | "green" | "red";
  link?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }
  return content;
}

export function DashboardPage() {
  const { user } = useAuth();

  // Fetch tasks assigned to current user
  const { data: myTasks = [], isLoading: tasksLoading } = useTasks(
    user ? { assignee_id: user.id } : undefined
  );

  // Fetch recent tasks (limited to 5)
  const { data: recentTasks = [], isLoading: recentLoading } = useTasks(
    user ? { assignee_id: user.id } : undefined,
    { per_page: 5 }
  );

  // Fetch user's projects
  const { data: projects = [], isLoading: projectsLoading } = useProjects(
    user ? { my_projects: true } : undefined
  );

  // Calculate stats
  const stats = {
    total: myTasks.length,
    inProgress: myTasks.filter((t) => t.status === "in_progress").length,
    done: myTasks.filter((t) => t.status === "done").length,
    overdue: myTasks.filter((t) => {
      if (!t.due_date || t.status === "done" || t.status === "cancelled") return false;
      return new Date(t.due_date) < new Date();
    }).length,
  };

  const isLoading = tasksLoading || recentLoading || projectsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Главная</h1>
        <p className="text-gray-600 mt-1">
          Добро пожаловать, {user?.name || "Пользователь"}!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Мои задачи"
          value={stats.total}
          color="blue"
          link="/tasks"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          }
        />

        <StatCard
          title="В работе"
          value={stats.inProgress}
          color="yellow"
          link="/tasks?status=in_progress"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Выполнено"
          value={stats.done}
          color="green"
          link="/tasks?status=done"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Просрочено"
          value={stats.overdue}
          color="red"
          link="/tasks?is_overdue=true"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
      </div>

      {/* Recent tasks & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Недавние задачи</CardTitle>
            <Link to="/tasks" className="text-sm text-blue-600 hover:text-blue-700">
              Все задачи →
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Нет задач</p>
                <Link to="/tasks" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
                  Создать задачу
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentTasks.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="py-3 flex items-center justify-between hover:bg-gray-50 -mx-4 px-4 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.status === "done"}
                        readOnly
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 pointer-events-none"
                      />
                      <span className={`truncate ${task.status === "done" ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <Badge type="priority" value={task.priority} />
                      <Badge type="status" value={task.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Мои проекты</CardTitle>
            <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-700">
              Все проекты →
            </Link>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Нет проектов</p>
                <Link to="/projects" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
                  Создать проект
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {projects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="py-3 flex items-center justify-between hover:bg-gray-50 -mx-4 px-4 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        {project.code?.substring(0, 2) || project.name.substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-gray-900 font-medium truncate">{project.name}</div>
                        <div className="text-xs text-gray-500">
                          {project.task_count || 0} задач
                        </div>
                      </div>
                    </div>
                    <Badge type="projectStatus" value={project.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
