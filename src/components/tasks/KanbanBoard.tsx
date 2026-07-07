import { useState, useRef } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import type { Task, TaskStatus, User } from '@/types';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onCreateTask: (status: TaskStatus) => void;
  onDeleteTask?: (taskId: string) => void;
  onStartTimeTracking?: (taskId: string) => void;
  onStopTimeTracking?: (taskId: string, entryId: string, description?: string) => void;
  readOnly?: boolean;
  currentUserId?: string;
}

interface Column {
  id: TaskStatus;
  titleKey: 'todo' | 'inProgress' | 'review' | 'done' | 'cancelled';
  color: string;
  bgColor: string;
}

const columns: Column[] = [
  { id: 'todo', titleKey: 'todo', color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.08)' },
  { id: 'in-progress', titleKey: 'inProgress', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.08)' },
  { id: 'review', titleKey: 'review', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.08)' },
  { id: 'done', titleKey: 'done', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.08)' },
  { id: 'cancelled', titleKey: 'cancelled', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.08)' }
];

export function KanbanBoard({
  tasks,
  users,
  onTaskClick,
  onStatusChange,
  onCreateTask,
  onDeleteTask,
  onStartTimeTracking,
  onStopTimeTracking,
  readOnly = false,
  currentUserId
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { t } = useLanguage();

  // Pointer-based drag state (works for both mouse and touch — HTML5 DnD has no touch support)
  const dragRef = useRef<{
    task: Task;
    ghost: HTMLElement;
    sourceEl: HTMLElement;
    offsetX: number;
    offsetY: number;
    pointerId: number;
  } | null>(null);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const showDragToast = (message: string, variant: 'warn' | 'error' = 'warn') => {
    const toast = document.createElement('div');
    toast.className = cn(
      'fixed top-20 left-1/2 -translate-x-1/2 text-white px-4 py-2 rounded-lg shadow-lg z-50',
      variant === 'error' ? 'bg-red-500' : 'bg-orange-500 animate-bounce'
    );
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, variant === 'error' ? 2500 : 2000);
  };

  const isTaskAssignedToUser = (task: Task) => {
    const hasAssignees = task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0;
    return !currentUserId || !!(hasAssignees && task.assignees.includes(currentUserId));
  };

  const cleanupDrag = () => {
    const state = dragRef.current;
    if (state) {
      state.ghost.remove();
      state.sourceEl.style.opacity = '1';
      state.sourceEl.style.transform = '';
    }
    dragRef.current = null;
    setDraggedTask(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
  };

  const handleHandlePointerDown = (e: React.PointerEvent, task: Task) => {
    if (readOnly) return;
    if (currentUserId && !isTaskAssignedToUser(task)) {
      showDragToast('⚠️ คุณไม่ได้รับมอบหมายงานนี้');
      return;
    }

    const handleEl = e.currentTarget as HTMLElement;
    const cardEl = handleEl.closest<HTMLElement>('[data-task-index]');
    if (!cardEl) return;

    e.preventDefault();
    const rect = cardEl.getBoundingClientRect();

    const ghost = cardEl.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.margin = '0';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.9';
    ghost.style.transform = 'rotate(2deg) scale(1.02)';
    ghost.style.zIndex = '9999';
    ghost.style.transition = 'none';
    document.body.appendChild(ghost);

    cardEl.style.opacity = '0.3';
    cardEl.style.transform = 'scale(0.97)';

    dragRef.current = { task, ghost, sourceEl: cardEl, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top, pointerId: e.pointerId };
    setDraggedTask(task);
    handleEl.setPointerCapture(e.pointerId);
  };

  const resolveDropTarget = (x: number, y: number) => {
    const target = document.elementFromPoint(x, y);
    const columnEl = target?.closest<HTMLElement>('[data-column-id]');
    const cardEl = target?.closest<HTMLElement>('[data-task-index]');
    return {
      columnId: columnEl?.dataset.columnId as TaskStatus | undefined,
      taskIndex: cardEl ? Number(cardEl.dataset.taskIndex) : null,
    };
  };

  const handleHandlePointerMove = (e: React.PointerEvent) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    e.preventDefault();

    state.ghost.style.left = `${e.clientX - state.offsetX}px`;
    state.ghost.style.top = `${e.clientY - state.offsetY}px`;

    const { columnId, taskIndex } = resolveDropTarget(e.clientX, e.clientY);
    setDragOverColumn(columnId ?? null);
    setDragOverIndex(taskIndex);
  };

  const handleHandlePointerUp = (e: React.PointerEvent) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    const { columnId } = resolveDropTarget(e.clientX, e.clientY);
    if (columnId && currentUserId && !isTaskAssignedToUser(state.task)) {
      showDragToast('❌ ไม่สามารถเปลี่ยนสถานะได้ - คุณไม่ได้รับมอบหมายงานนี้', 'error');
    } else if (columnId && state.task.status !== columnId) {
      onStatusChange(state.task.id, columnId);
    }
    cleanupDrag();
  };

  const handleHandlePointerCancel = (e: React.PointerEvent) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    cleanupDrag();
  };

  return (
    <div className="kanban-scroll flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
      {columns.map((column, _columnIndex) => {
        const columnTasks = getTasksByStatus(column.id);
        const isDragOver = dragOverColumn === column.id;
        const columnTitle = t.kanban[column.titleKey];

        return (
          <div
            key={column.id}
            data-column-id={column.id}
            className={cn(
              "flex-shrink-0 w-80 flex flex-col rounded-xl transition-all duration-300",
              "border border-white/5",
              isDragOver && "border-white/20 shadow-lg shadow-white/5"
            )}
            style={{
              backgroundColor: isDragOver
                ? column.bgColor.replace('0.05', '0.12')
                : column.bgColor,
              transform: 'translateY(0)',
              transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            {/* Column Header */}
            <div
              className="flex items-center justify-between p-4 border-b border-white/5"
              style={{ borderTop: `4px solid ${column.color}` }}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{columnTitle}</h3>
                <span
                  className="px-2 py-0.5 text-xs rounded-full font-medium"
                  style={{
                    backgroundColor: `${column.color}20`,
                    color: column.color
                  }}
                >
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-white/10 active:bg-white/10 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
                {!readOnly && (
                  <button
                    onClick={() => onCreateTask(column.id)}
                    className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-white/10 active:bg-white/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 p-3 space-y-1 min-h-[200px]">
                  {columnTasks.map((task, taskIndex) => {
                const isBeingDragged = draggedTask?.id === task.id;
                const showDropBefore = isDragOver && dragOverIndex === taskIndex && !isBeingDragged;
                
                // Check if user is assigned
                const isUserAssigned = isTaskAssignedToUser(task);
                const canDrag = !readOnly && isUserAssigned;

                return (
                  <div key={task.id}>
                    {/* Drop indicator line */}
                    {showDropBefore && (
                      <div className="flex items-center gap-2 py-1 animate-slide-in">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                        <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: column.color }} />
                      </div>
                    )}
                    <div
                      data-task-index={taskIndex}
                      title={
                        readOnly 
                          ? 'โหมดดูอย่างเชียว' 
                          : !isUserAssigned
                            ? 'คุณต้องเป็นผู้รับผิดชอบถึงจะเปลี่ยนสถานะได้'
                            : 'ลากเพื่อเปลี่ยนสถานะ'
                      }
                      className={cn(
                        "transition-all duration-200 mb-2",
                        isBeingDragged && "opacity-30 scale-95",
                        readOnly && "cursor-not-allowed opacity-60",
                        !isUserAssigned && "cursor-not-allowed opacity-75"
                      )}
                      style={{
                        animationDelay: `${taskIndex * 80}ms`,
                        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
                      }}
                    >
                      <TaskCard
                        task={task}
                        users={users}
                        onClick={() => onTaskClick(task)}
                        onDelete={
                          !readOnly && isUserAssigned && onDeleteTask 
                            ? () => onDeleteTask(task.id) 
                            : undefined
                        }
                        onStartTimeTracking={
                          !readOnly && onStartTimeTracking 
                            ? () => onStartTimeTracking(task.id) 
                            : undefined
                        }
                        onStopTimeTracking={
                          !readOnly && onStopTimeTracking
                            ? onStopTimeTracking 
                            : undefined
                        }
                        showDragHandle={canDrag}
                        currentUserId={currentUserId}
                        onHandlePointerDown={(e) => handleHandlePointerDown(e, task)}
                        onHandlePointerMove={handleHandlePointerMove}
                        onHandlePointerUp={handleHandlePointerUp}
                        onHandlePointerCancel={handleHandlePointerCancel}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Drop zone at end */}
              {isDragOver && (dragOverIndex === null || dragOverIndex >= columnTasks.length) && (
                <div className="flex items-center gap-2 py-1 animate-slide-in">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                  <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: column.color }} />
                </div>
              )}

              {columnTasks.length === 0 && !isDragOver && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${column.color}10` }}
                  >
                    <Plus className="w-5 h-5" style={{ color: column.color }} />
                  </div>
                  <p className="text-sm">{t.kanban.noTasks}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCreateTask(column.id)}
                    className="mt-2 text-xs hover:text-white"
                    style={{ color: column.color }}
                  >
                    {t.kanban.addTask}
                  </Button>
                </div>
              )}

              {/* Drop here message for empty columns */}
              {columnTasks.length === 0 && isDragOver && (
                <div className="flex items-center justify-center py-12 rounded-xl border-2 border-dashed transition-all"
                  style={{ borderColor: column.color, backgroundColor: `${column.color}10` }}
                >
                  <span className="text-sm font-medium" style={{ color: column.color }}>
                    {t.kanban.dropHere}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
