/**
 * SmartTask360 — Inbox Page (Входящие)
 * Shows pending tasks requiring action, unread comments, mentions
 */

import { Card, CardContent, EmptyState } from "../shared/ui";

export function InboxPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Входящие</h1>
        <p className="text-gray-600 mt-1">
          Задачи, требующие вашего внимания
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
          Комментарии (0)
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
          Упоминания (0)
        </button>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent>
          <EmptyState
            icon={
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
              </svg>
            }
            title="Входящие пусты"
            description="Новые задачи, комментарии и упоминания появятся здесь"
          />
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Что здесь будет?</h3>
              <p className="text-sm text-gray-500 mt-1">
                • Новые задачи, требующие принятия<br />
                • Непрочитанные комментарии<br />
                • Упоминания (@вы)<br />
                • AI-рекомендации по задачам
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
