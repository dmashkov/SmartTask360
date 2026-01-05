/**
 * SmartTask360 — Project table header
 */

export function ProjectTableHeader() {
  return (
    <div className="flex items-center px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
      <div className="w-24 shrink-0">Код</div>
      <div className="flex-1">Название</div>
      <div className="w-28 shrink-0">Статус</div>
      <div className="w-24 shrink-0">Задачи</div>
      <div className="w-20 shrink-0">Участники</div>
      <div className="w-28 shrink-0">Срок</div>
      <div className="w-8 shrink-0"></div>
    </div>
  );
}
