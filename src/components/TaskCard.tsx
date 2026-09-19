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
  User,
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
  User,
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
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
            فوری
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            مهم
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
            عادی
          </span>
        );
    }
  };

  return (
    <div
      className={`group relative rounded-2xl p-3.5 transition-all duration-200 border ${
        task.completed
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-75'
          : task.isPinned
          ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800/70 shadow-sm'
          : 'bg-white dark:bg-slate-850 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {/* Top row: Checkbox, Title, Pin, Actions Menu */}
      <div className="flex items-start gap-3">
        {/* Custom animated checkbox */}
        <button
          onClick={() => toggleTaskComplete(task.id)}
          aria-label={task.completed ? 'علامت‌گذاری به عنوان انجام نشده' : 'علامت‌گذاری به عنوان انجام شده'}
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
            task.completed
              ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30'
              : 'border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-slate-900'
          }`}
        >
          {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Task Title & Description */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <h3
              className={`text-sm font-bold leading-snug transition-colors line-clamp-2 ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-white'
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              {task.description}
            </p>
          )}
        </div>

        {/* Pin button */}
        <button
          onClick={() => togglePin(task.id)}
          className={`p-1 rounded-lg transition-colors ${
            task.isPinned
              ? 'text-amber-500'
              : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400'
          }`}
          title={task.isPinned ? 'حذف سنجاق' : 'سنجاق به بالا'}
        >
          <Star className={`w-4 h-4 ${task.isPinned ? 'fill-amber-400' : ''}`} />
        </button>

        {/* More Menu Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute left-0 top-6 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-40 text-xs">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    openEditModal(task);
                  }}
                  className="w-full px-3 py-2 text-right flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                  ویرایش
                </button>
                <button
                  onClick={(e) => {
                    setShowMenu(false);
                    startFocusForTask(e);
                  }}
                  className="w-full px-3 py-2 text-right flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                >
                  <Timer className="w-3.5 h-3.5 text-amber-500" />
                  شروع تمرکز
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (window.confirm('آیا این تسک حذف شود؟')) {
                      deleteTask(task.id);
                    }
                  }}
                  className="w-full px-3 py-2 text-right flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف تسک
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expanded description if open */}
      {expanded && task.description && (
        <div className="mt-2.5 mr-9 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/40">
          {task.description}
        </div>
      )}

      {/* Subtasks checklist if present */}
      {totalSubtasks > 0 && (
        <div className="mt-2 mr-9">
          <div
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 py-1 cursor-pointer select-none"
          >
            <span className="flex items-center gap-1 font-medium">
              <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
              {toPersianDigits(completedSubtasks)} از {toPersianDigits(totalSubtasks)} زیرتسک انجام شد
            </span>
            <span className="flex items-center gap-0.5 text-slate-400">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </div>

          {/* Subtask progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden my-1">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>

          {/* Subtask list if expanded */}
          {expanded && (
            <div className="space-y-1.5 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => toggleSubtask(task.id, st.id)}
                  className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  {st.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  )}
                  <span
                    className={`text-xs ${
                      st.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-300'
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
      <div className="mt-3 mr-9 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100/80 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5 flex-wrap">
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
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
              <Clock className="w-3 h-3 text-slate-400" />
              {toPersianDigits(task.time)}
            </span>
          )}

          {/* Focus minutes spent */}
          {(task.focusMinutesSpent || 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Timer className="w-3 h-3 text-indigo-500" />
              {toPersianDigits(task.focusMinutesSpent)} دقیقه تمرکز
            </span>
          )}
        </div>

        {/* Quick Focus Button */}
        {!task.completed && (
          <button
            onClick={startFocusForTask}
            className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors mr-auto"
            title="تمرکز با پومودورو"
          >
            <Timer className="w-3 h-3" />
            <span>تایمر</span>
          </button>
        )}
      </div>
    </div>
  );
};
