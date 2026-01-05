import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

// Icons as reusable components
const Icons = {
  home: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  inbox: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  ),
  tasks: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  review: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  star: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  ),
  okr: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  ),
  bsc: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  folder: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  ),
  boards: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  documents: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  team: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  reports: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
    </svg>
  ),
  settings: (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  collapse: (
    <svg className="h-5 w-5 flex-shrink-0 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
    </svg>
  ),
  lock: (
    <svg className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
};

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  locked?: boolean; // Phase 2 stub
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Navigation structure with sections
const navSections: NavSection[] = [
  {
    title: "",
    items: [
      { name: "Главная", href: "/", icon: Icons.home },
    ],
  },
  {
    title: "ЛИЧНЫЙ КАБИНЕТ",
    items: [
      { name: "Входящие", href: "/inbox", icon: Icons.inbox, badge: 0 },
      { name: "Задачи мне", href: "/tasks?role=assignee", icon: Icons.tasks },
      { name: "Задачи от меня", href: "/tasks?role=creator", icon: Icons.review },
      { name: "На проверку", href: "/tasks?role=creator&status=in_review", icon: Icons.review },
      { name: "Избранное", href: "/favorites", icon: Icons.star },
    ],
  },
  {
    title: "СТРАТЕГИЯ",
    items: [
      { name: "OKR", href: "/okr", icon: Icons.okr, locked: true },
      { name: "BSC", href: "/bsc", icon: Icons.bsc, locked: true },
    ],
  },
  {
    title: "РАБОТА",
    items: [
      { name: "Все задачи", href: "/tasks", icon: Icons.tasks },
      { name: "Проекты", href: "/projects", icon: Icons.folder },
    ],
  },
  {
    title: "ОБЩЕЕ",
    items: [
      { name: "Документы", href: "/documents", icon: Icons.documents },
      { name: "Команда", href: "/team", icon: Icons.team },
      { name: "Отчёты", href: "/reports", icon: Icons.reports, locked: true },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

function SectionDivider({ title, isCollapsed }: { title: string; isCollapsed: boolean }) {
  if (!title) return null;

  if (isCollapsed) {
    return <div className="h-px bg-gray-200 my-2 mx-2" />;
  }

  return (
    <div className="px-3 py-2 mt-2">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        {title}
      </span>
    </div>
  );
}

function NavItemComponent({
  item,
  isCollapsed,
  onClose,
}: {
  item: NavItem;
  isCollapsed: boolean;
  onClose?: () => void;
}) {
  const location = useLocation();

  // Check if this item is active (considering query params for /tasks routes)
  const isActive = (() => {
    const [itemPath, itemSearch] = item.href.split("?");
    const currentPath = location.pathname;
    const currentSearch = location.search;

    // Exact path match required
    if (currentPath !== itemPath) return false;

    // For items without query params, only match if current URL also has no params
    if (!itemSearch) {
      return !currentSearch || currentSearch === "";
    }

    // For items with query params, check if all item params are in current URL
    const itemParams = new URLSearchParams(itemSearch);
    const currentParams = new URLSearchParams(currentSearch);

    for (const [key, value] of itemParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  })();

  // Locked items (Phase 2 stubs)
  if (item.locked) {
    return (
      <div
        title={isCollapsed ? `${item.name} (скоро)` : undefined}
        className={cn(
          "flex items-center text-sm font-medium rounded-md cursor-not-allowed opacity-60",
          isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
          "text-gray-400"
        )}
      >
        {item.icon}
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.name}</span>
            {Icons.lock}
          </>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.href}
      title={isCollapsed ? item.name : undefined}
      className={cn(
        "flex items-center text-sm font-medium rounded-md transition-colors",
        isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
        isActive
          ? "bg-blue-50 text-blue-700"
          : "text-gray-700 hover:bg-gray-100"
      )}
      onClick={onClose}
    >
      {item.icon}
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.name}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="bg-red-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ isOpen, isCollapsed = false, onClose, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-all duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            "flex items-center h-16 border-b border-gray-200",
            isCollapsed ? "justify-center px-2" : "px-6 gap-3"
          )}>
            {/* Logo Icon */}
            <svg className="h-8 w-8 flex-shrink-0" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#3B82F6" strokeWidth="2.5" fill="white"/>
              <path d="M16 2 A14 14 0 1 1 5.5 26" stroke="url(#sidebarGradient)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M10 16 L14 20 L22 12" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M5 24 L3 27 L7 26" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <defs>
                <linearGradient id="sidebarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6"/>
                  <stop offset="50%" stopColor="#8B5CF6"/>
                  <stop offset="100%" stopColor="#10B981"/>
                </linearGradient>
              </defs>
            </svg>
            {!isCollapsed && (
              <span className="text-xl font-bold text-gray-900">SmartTask360</span>
            )}
          </div>

          {/* Navigation with sections */}
          <nav className={cn(
            "flex-1 py-2 overflow-y-auto",
            isCollapsed ? "px-2" : "px-2"
          )}>
            {navSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <SectionDivider title={section.title} isCollapsed={isCollapsed} />
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavItemComponent
                      key={item.href}
                      item={item}
                      isCollapsed={isCollapsed}
                      onClose={onClose}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer with Settings and Collapse button */}
          <div className={cn(
            "py-4 border-t border-gray-200",
            isCollapsed ? "px-2" : "px-2"
          )}>
            <NavLink
              to="/settings"
              title={isCollapsed ? "Настройки" : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center text-sm font-medium rounded-md transition-colors",
                  isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                )
              }
              onClick={onClose}
            >
              {Icons.settings}
              {!isCollapsed && <span>Настройки</span>}
            </NavLink>

            {/* Collapse button - only visible on desktop */}
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
              className={cn(
                "hidden lg:flex items-center w-full text-sm font-medium rounded-md transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-700 mt-2",
                isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"
              )}
            >
              <span className={cn(isCollapsed && "rotate-180", "transition-transform")}>
                {Icons.collapse}
              </span>
              {!isCollapsed && <span>Свернуть меню</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
