/**
 * SmartTask360 — Favorites Page (Избранное)
 * Shows starred/bookmarked tasks, projects, and saved filters
 */

import { Card, CardContent, EmptyState } from "../shared/ui";

export function FavoritesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Избранное</h1>
        <p className="text-gray-600 mt-1">
          Закреплённые задачи, проекты и сохранённые фильтры
        </p>
      </div>

      {/* Tabs (placeholder) */}
      <div className="flex gap-2 border-b border-gray-200">
        <button className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
          Все
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
          Задачи (0)
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
          Проекты (0)
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
          Фильтры (0)
        </button>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent>
          <EmptyState
            icon={
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            }
            title="Избранное пусто"
            description="Добавляйте задачи и проекты в избранное для быстрого доступа"
          />
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Как добавить в избранное?</h3>
              <p className="text-sm text-gray-500 mt-1">
                • Нажмите ⭐ на карточке задачи или проекта<br />
                • Сохраните фильтр из списка задач<br />
                • Закрепите важные элементы для быстрого доступа
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
