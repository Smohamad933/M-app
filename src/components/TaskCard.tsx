import React, { useState } from 'react';
import type { Task } from '../types';
import { useTask } from '../context/TaskContext';
import { toPersianDigits, formatPersianDate } from '../utils/persianDate';
import {
  Check,
  Calendar,
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
  FolderKanban,
  AlertTriangle,
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
    projects,
    setActiveFocusTaskId,
    setActiveTab,
    currentUser,
    openIncompleteModal,
  } = useTask();

  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const category = categories.find((c) => c.id === task.categoryId);
  const CategoryIcon = category?.icon && CATEGORY_ICONS[category.icon] ? CATEGORY_ICONS[category.icon] : Folder;
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;

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
          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
            فوری
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            مهم
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
            عادی
          </span>
        );
    }
  };

  return (
    <div
      className={`group relative rounded-2xl p-4 transition-all duration-200 border ${
        task.completed
          ? 'bg-slate-50/70 border-slate-200/60 opacity-75'
          : task.isPinned
          ? 'bg-white border-[#f95738]/40 shadow-sm ring-1 ring-[#f95738]/10'
          : 'bg-[#f8fafc] border-slate-100 hover:border-slate-200 hover:bg-white shadow-2xs'
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
              ? 'bg-[#00b884] text-white shadow-xs'
              : 'border-2 border-slate-300 hover:border-[#00b884] bg-white'
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
              className={`text-xs sm:text-sm font-extrabold leading-snug transition-colors line-clamp-2 ${
                task.completed
                  ? 'line-through text-slate-400'
                  : 'text-slate-900'
              }`}
            >
              {task.title}
            </h3>

            {task.isPinned && (
              <span title="سنجاق شده">
                <Star className="w-3.5 h-3.5 fill-[#f95738] text-[#f95738] flex-shrink-0" />
              </span>
            )}
          </div>

          {task.description && !expanded && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Pin button */}
        <button
          onClick={() => togglePin(task.id)}
          className={`p-1 rounded-lg transition-colors cursor-pointer ${
            task.isPinned
              ? 'text-[#f95738]'
              : 'text-slate-400 hover:text-[#f95738]'
          }`}
          title={task.isPinned ? 'حذف سنجاق' : 'سنجاق به بالا'}
        >
          <Star className={`w-3.5 h-3.5 ${task.isPinned ? 'fill-[#f95738]' : ''}`} />
        </button>

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute left-0 top-6 w-38 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40 text-xs font-bold">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    openEditModal(task);
                  }}
                  className="w-full px-3 py-2 text-right flex items-center gap-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  ویرایش
                </button>
                <button
                  onClick={(e) => {
                    setShowMenu(false);
                    startFocusForTask(e);
                  }}
                  className="w-full px-3 py-2 text-right flex items-center gap-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Timer className="w-3.5 h-3.5 text-amber-500" />
                  شروع تمرکز
                </button>
                {!task.completed && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      openIncompleteModal(task);
                    }}
                    className="w-full px-3 py-2 text-right flex items-center gap-2 text-amber-600 hover:bg-amber-50 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    ثبت دلیل عدم انجام
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (window.confirm('آیا این تسک حذف شود؟')) {
                      deleteTask(task.id);
                    }
                  }}
                  className="w-full px-3 py-2 text-right flex items-center gap-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
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
        <div className="mt-2.5 mr-8 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/70 leading-relaxed shadow-2xs">
          {task.description}
        </div>
      )}

      {/* Subtasks checklist if present */}
      {totalSubtasks > 0 && (
        <div className="mt-2 mr-8">
          <div
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between text-[11px] text-slate-500 py-1 cursor-pointer select-none"
          >
            <span className="flex items-center gap-1 font-bold">
              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
              {toPersianDigits(completedSubtasks)} از {toPersianDigits(totalSubtasks)} زیرتسک انجام شد
            </span>
            <span className="flex items-center gap-0.5 text-slate-400">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </div>

          <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden my-1">
            <div
              className="bg-[#00b884] h-full rounded-full transition-all duration-300"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>

          {expanded && (
            <div className="space-y-1.5 mt-2 pt-1 border-t border-slate-100">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => toggleSubtask(task.id, st.id)}
                  className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-100/70 cursor-pointer transition-colors"
                >
                  {st.completed ? (
                    <CheckSquare className="w-4 h-4 text-[#00b884] flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                  <span
                    className={`text-xs ${
                      st.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'
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
      <div className="mt-3 mr-8 flex items-center justify-between flex-wrap gap-2 pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* User badge for admin only */}
          {currentUser?.role === 'admin' && task.userName && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              <UserIcon className="w-3 h-3" />
              {task.userName}
            </span>
          )}

          {/* Priority */}
          {getPriorityBadge(task.priority)}

          {/* Category */}
          {category && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
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

          {/* Team Project */}
          {(project || task.projectName) && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${project?.color || '#6366f1'}15`,
                color: project?.color || '#6366f1',
                borderColor: `${project?.color || '#6366f1'}30`,
                borderWidth: '1px',
              }}
            >
              <FolderKanban className="w-3 h-3" />
              {project?.name || task.projectName}
            </span>
          )}

          {/* Due Time */}
          {task.time && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
              <Clock className="w-3 h-3 text-slate-400" />
              {toPersianDigits(task.time)}
            </span>
          )}

          {/* Persian Task Date */}
          {task.date && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80" title="تاریخ انجام تسک">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formatPersianDate(task.date, 'dayMonth')}
            </span>
          )}

          {/* Focus minutes spent */}
          {(task.focusMinutesSpent || 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
              <Timer className="w-3 h-3 text-slate-400" />
              {toPersianDigits(task.focusMinutesSpent)} دقیقه تمرکز
            </span>
          )}

          {/* Reason uncompleted badge */}
          {task.reasonUncompleted && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
              title={`دلیل عدم انجام: ${task.reasonUncompleted}`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              عدم انجام: {task.reasonUncompleted}
            </span>
          )}
        </div>

        {/* Focus Trigger Button */}
        {!task.completed && (
          <button
            onClick={startFocusForTask}
            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-700 hover:text-black transition-colors cursor-pointer mr-auto"
            title="ورود به تایمر پومودورو برای این تسک"
          >
            <Timer className="w-3.5 h-3.5 text-amber-500" />
            <span>تمرکز</span>
          </button>
        )}
      </div>
    </div>
  );
};
