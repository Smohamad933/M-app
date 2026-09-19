import React, { useState } from 'react';
import type { Task } from '../types';
import { useTask } from '../context/TaskContext';
import { toPersianDigits } from '../utils/persianDate';
import {
  Check,
  Clock,
  Star,
  MoreVertical,
  Timer,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Briefcase,
  User as UserIcon,
  BookOpen,
  Activity,
  ShoppingCart,
  CreditCard,
  Folder,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Briefcase,
  User: UserIcon,
  BookOpen,
  Activity,
  ShoppingCart,
  CreditCard,
};

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const {
    toggleTaskComplete,
    toggleSubtask,
    togglePin,
    openEditModal,
    deleteTask,
    categories,
    setActiveFocusTaskId,
    setActiveTab,
    currentUser,
  } = useTask();

  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const category = categories.find((c) => c.id === task.categoryId);
  const CategoryIcon = category?.icon && CATEGORY_ICONS[category.icon] ? CATEGORY_ICONS[category.icon] : Folder;

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;

  const startFocusForTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveFocusTaskId(task.id);
    setActiveTab('focus');
  };

  const getPriorityBadge = (p: Task['priority']) => {
    switch (p) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
            فوری
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            مهم
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            عادی
          </span>
        );
    }
  };

  return (
    <div
      className={`group relative rounded-2xl p-3.5 transition-all duration-200 border ${
        task.completed
          ? 'bg-zinc-900/30 border-zinc-800/40 opacity-70'
          : task.isPinned
          ? 'bg-zinc-900/90 border-zinc-700 shadow-sm'
          : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700'
      }`}
    >
      {/* Top row: Checkbox, Title, Pin, Actions Menu */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => toggleTaskComplete(task.id)}
          aria-label={task.completed ? 'علامت‌گذاری به عنوان انجام نشده' : 'علامت‌گذاری به عنوان انجام شده'}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
            task.completed
              ? 'bg-emerald-500 text-white shadow-xs'
              : 'border border-zinc-600 hover:border-white bg-zinc-800/80'
          }`}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Title & Description */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <h3
              className={`text-xs sm:text-sm font-bold leading-snug transition-colors line-clamp-2 ${
                task.completed
                  ? 'line-through text-zinc-500'
                  : 'text-white'
              }`}
            >
              {task.title}
            </h3>

            {task.isPinned && (
              <span title="سنجاق شده">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
              </span>
            )}
          </div>

          {task.description && !expanded && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
              {task.description}
            </p>
          )}
        </div>

        {/* Pin button */}
        <button
          onClick={() => togglePin(task.id)}
          className={`p-1 rounded-lg transition-colors cursor-pointer ${
            task.isPinned
              ? 'text-amber-400'
              : 'text-zinc-600 hover:text-amber-400'
          }`}
          title={task.isPinned ? 'حذف سنجاق' : 'سنجاق به بالا'}
        >
          <Star className={`w-3.5 h-3.5 ${task.isPinned ? 'fill-amber-400' : ''}`} />
        </button>

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute left-0 top-6 w-36 bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 py-1 z-40 text-xs">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    openEditModal(task);
                  }}
                  className="w-full px-3 py-2 text-right flex items-center gap-2 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                  ویرایش
                </button>
                <button
                  onClick={(e) => {
                    setShowMenu(false);
                    startFocusForTask(e);
                  }}
                  className="w-full px-3 py-2 text-right flex items-center gap-2 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  شروع تمرکز
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (window.confirm('آیا این تسک حذف شود؟')) {
                      deleteTask(task.id);
                    }
                  }}
                  className="w-full px-3 py-2 text-right flex items-center gap-2 text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف تسک
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expanded description */}
      {expanded && task.description && (
        <div className="mt-2.5 mr-8 text-xs text-zinc-300 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/70">
          {task.description}
        </div>
      )}

      {/* Subtasks checklist if present */}
      {totalSubtasks > 0 && (
        <div className="mt-2 mr-8">
          <div
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between text-[11px] text-zinc-400 py-1 cursor-pointer select-none"
          >
            <span className="flex items-center gap-1 font-medium">
              <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
              {toPersianDigits(completedSubtasks)} از {toPersianDigits(totalSubtasks)} زیرتسک انجام شد
            </span>
            <span className="flex items-center gap-0.5 text-zinc-500">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </div>

          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden my-1">
            <div
              className="bg-white h-full rounded-full transition-all duration-300"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>

          {expanded && (
            <div className="space-y-1.5 mt-2 pt-1 border-t border-zinc-800">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => toggleSubtask(task.id, st.id)}
                  className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-zinc-800/60 cursor-pointer transition-colors"
                >
                  {st.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  )}
                  <span
                    className={`text-xs ${
                      st.completed ? 'line-through text-zinc-500' : 'text-zinc-300'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom row: Badges, Category, Time, Focus Trigger */}
      <div className="mt-3 mr-8 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-zinc-800/60">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* User badge for admin only */}
          {currentUser?.role === 'admin' && task.userName && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <UserIcon className="w-3 h-3" />
              {task.userName}
            </span>
          )}

          {/* Priority */}
          {getPriorityBadge(task.priority)}

          {/* Category */}
          {category && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${category.color}15`,
                color: category.color,
                borderColor: `${category.color}30`,
                borderWidth: '1px',
              }}
            >
              <CategoryIcon className="w-3 h-3" />
              {category.name}
            </span>
          )}

          {/* Due Time */}
          {task.time && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
              <Clock className="w-3 h-3 text-zinc-500" />
              {toPersianDigits(task.time)}
            </span>
          )}

          {/* Focus minutes spent */}
          {(task.focusMinutesSpent || 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/50">
              <Timer className="w-3 h-3 text-zinc-400" />
              {toPersianDigits(task.focusMinutesSpent)} دقیقه تمرکز
            </span>
          )}
        </div>

        {/* Quick Focus Button */}
        {!task.completed && (
          <button
            onClick={startFocusForTask}
            className="flex items-center gap-1 text-[10px] font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 px-2 py-1 rounded-lg transition-colors mr-auto cursor-pointer"
            title="تمرکز با پومودورو"
          >
            <Timer className="w-3 h-3" />
            <span>تمرکز</span>
          </button>
        )}
      </div>
    </div>
  );
};
