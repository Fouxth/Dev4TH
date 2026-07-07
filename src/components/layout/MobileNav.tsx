import { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Calendar,
  Zap,
  Users,
  BarChart3,
  FileText,
  Settings,
  Briefcase,
  MoreHorizontal,
  MessageSquare,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface MobileNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
  userRole?: string;
  totalUnread?: number;
  onChatOpen?: () => void;
}

export function MobileNav({ activeView, onViewChange, userRole, totalUnread = 0, onChatOpen }: MobileNavProps) {
  const { t } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.sidebar.dashboard },
    { id: 'tasks', icon: CheckSquare, label: t.sidebar.tasks },
    { id: 'projects', icon: FolderKanban, label: t.sidebar.projects },
    { id: 'calendar', icon: Calendar, label: t.sidebar.calendar },
  ];

  const moreItems = [
    { id: 'sprints', icon: Zap, label: t.sidebar.sprints },
    { id: 'team', icon: Users, label: t.sidebar.team },
    { id: 'quotation-requests', icon: FileText, label: 'เอกสาร', roles: ['admin', 'manager'] as string[] },
    { id: 'public-works', icon: Briefcase, label: 'ผลงาน', roles: ['admin', 'manager'] as string[] },
    { id: 'reports', icon: BarChart3, label: t.sidebar.reports, roles: ['admin', 'manager'] as string[] },
    { id: 'settings', icon: Settings, label: t.sidebar.settings },
  ].filter(item => !item.roles || (userRole && item.roles.includes(userRole)));

  const isMoreActive = moreItems.some(item => item.id === activeView);

  const handleSelect = (id: string) => {
    onViewChange(id);
    setMoreOpen(false);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-white/10 safe-area-bottom"
        style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)' }}
      >
        <div className="grid grid-cols-5 items-stretch px-1 py-1.5">
          {primaryItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-h-[48px]",
                  isActive
                    ? "text-[var(--orange)] bg-[var(--orange)]/10"
                    : "text-gray-400 active:text-white active:bg-white/5"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className="text-[10px] font-medium leading-tight truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-h-[48px] relative",
              isMoreActive
                ? "text-[var(--orange)] bg-[var(--orange)]/10"
                : "text-gray-400 active:text-white active:bg-white/5"
            )}
          >
            <div className="relative">
              <MoreHorizontal className={cn("w-5 h-5", isMoreActive && "scale-110")} />
              {totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[var(--orange)] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-tight truncate max-w-full">
              เพิ่มเติม
            </span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-[#1a1a1a] border-t border-white/10 shadow-2xl animate-slide-up safe-area-bottom"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-base font-semibold text-white">เพิ่มเติม</h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-3 grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
              <button
                onClick={() => { onChatOpen?.(); setMoreOpen(false); }}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-colors text-gray-300 active:bg-white/5 relative"
              >
                <div className="relative">
                  <MessageSquare className="w-5 h-5" />
                  {totalUnread > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[var(--orange)] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">แชท</span>
              </button>

              {moreItems.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-colors",
                      isActive
                        ? "text-[var(--orange)] bg-[var(--orange)]/10"
                        : "text-gray-300 active:bg-white/5"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
