import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import type { TeamProject } from '../types';
import { toPersianDigits } from '../utils/persianDate';
import { TaskCard } from './TaskCard';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Edit2,
  Trash2,
  Briefcase,
  Rocket,
  Target,
  Code,
  Layers,
  ChevronLeft,
  X,
  UserCheck,
} from 'lucide-react';

const PROJECT_ICONS = [
  { id: 'FolderKanban', label: 'کانبان', icon: FolderKanban },
  { id: 'Briefcase', label: 'شغلی', icon: Briefcase },
  { id: 'Rocket', label: 'استارتاپ', icon: Rocket },
  { id: 'Target', label: 'هدف', icon: Target },
  { id: 'Code', label: 'برنامه‌نویسی', icon: Code },
  { id: 'Layers', label: 'لایه', icon: Layers },
];

const PROJECT_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#ec4899', // Pink
];

export const TeamProjectsView: React.FC = () => {
  const {
    projects,
    tasks,
    users,
    currentUser,
    createTeamProject,
    updateTeamProject,
    deleteTeamProject,
    openCreateModal,
  } = useTask();

  const [selectedProject, setSelectedProject] = useState<TeamProject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<TeamProject | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('FolderKanban');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tasks within active project view
  const [projectFilter, setProjectFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const openCreateDialog = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setColor('#6366f1');
    setIcon('FolderKanban');
    setSelectedMembers(currentUser ? [currentUser.id] : []);
    setIsModalOpen(true);
  };

  const openEditDialog = (proj: TeamProject) => {
    setEditingProject(proj);
    setName(proj.name);
    setDescription(proj.description || '');
    setColor(proj.color || '#6366f1');
    setIcon(proj.icon || 'FolderKanban');
    setSelectedMembers(proj.memberIds || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingProject) {
        await updateTeamProject(editingProject.id, {
          name: name.trim(),
          description: description.trim(),
          color,
          icon,
          memberIds: selectedMembers,
        });
        if (selectedProject?.id === editingProject.id) {
          setSelectedProject({
            ...selectedProject,
            name: name.trim(),
            description: description.trim(),
            color,
            icon,
            memberIds: selectedMembers,
          });
        }
      } else {
        const created = await createTeamProject({
          name: name.trim(),
          description: description.trim(),
          color,
          icon,
          memberIds: selectedMembers,
        });
        setSelectedProject(created);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (projId: string) => {
    if (window.confirm('آیا از حذف این پروژه تیمی اطمینان دارید؟ تسک‌های آن حذف نمی‌شوند ولی ارتباطشان با پروژه قطع می‌گردد.')) {
      await deleteTeamProject(projId);
      if (selectedProject?.id === projId) {
        setSelectedProject(null);
      }
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const renderIcon = (iconName: string, className = 'w-5 h-5') => {
    const found = PROJECT_ICONS.find((i) => i.id === iconName);
    const Comp = found ? found.icon : FolderKanban;
    return <Comp className={className} />;
  };

  // If a project is actively selected, show its deep view
  if (selectedProject) {
    const projectTasks = tasks.filter((t) => t.projectId === selectedProject.id);
    const completedTasks = projectTasks.filter((t) => t.completed);
    const pendingTasks = projectTasks.filter((t) => !t.completed);
    const progress = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;

    let displayedTasks = projectTasks;
    if (projectFilter === 'pending') displayedTasks = pendingTasks;
    if (projectFilter === 'completed') displayedTasks = completedTasks;

    const canEdit = currentUser?.role === 'admin' || selectedProject.creatorId === currentUser?.id;

    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Back navigation & Actions Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-bold transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>بازگشت به همه پروژه‌ها</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {canEdit && (
              <>
                <button
                  onClick={() => openEditDialog(selectedProject)}
                  className="px-3.5 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>ویرایش پروژه</span>
                </button>
                <button
                  onClick={() => handleDelete(selectedProject.id)}
                  className="px-3.5 py-2 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </>
            )}

            <button
              onClick={() => openCreateModal(undefined, undefined, selectedProject.id)}
              className="px-4 py-2 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>تسک جدید در پروژه</span>
            </button>
          </div>
        </div>

        {/* Project Header Banner */}
        <div className="p-6 bg-zinc-900/80 rounded-3xl border border-zinc-800 space-y-5 backdrop-blur-md relative overflow-hidden">
          <div
            className="absolute top-0 right-0 left-0 h-1.5"
            style={{ backgroundColor: selectedProject.color || '#6366f1' }}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                style={{ backgroundColor: selectedProject.color || '#6366f1' }}
              >
                {renderIcon(selectedProject.icon, 'w-6 h-6')}
              </div>
              <div>
                <h1 className="text-lg font-black text-white">{selectedProject.name}</h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ایجاد شده توسط <span className="text-zinc-200 font-semibold">{selectedProject.creatorName}</span>
                </p>
              </div>
            </div>

            {/* Team Members Avatars */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-bold ml-1">اعضای پروژه:</span>
              <div className="flex -space-x-2 space-x-reverse overflow-hidden">
                {selectedProject.memberIds?.map((mId) => {
                  const u = users.find((user) => user.id === mId);
                  const name = u?.name || 'عضو';
                  return (
                    <div
                      key={mId}
                      title={name}
                      className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 text-white font-black text-xs flex items-center justify-center shadow-xs"
                    >
                      {name.slice(0, 1)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedProject.description && (
            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-800/40 p-3 rounded-2xl border border-zinc-800/60">
              {selectedProject.description}
            </p>
          )}

          {/* Progress Overview Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-semibold">
                پیشرفت کل پروژه ({toPersianDigits(completedTasks.length)} از {toPersianDigits(projectTasks.length)} تسک)
              </span>
              <span className="font-mono font-bold text-white">{toPersianDigits(progress)}٪</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: selectedProject.color || '#6366f1',
                }}
              />
            </div>
          </div>
        </div>

        {/* Project Task List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {/* Filter Tabs */}
            <div className="inline-flex p-1 bg-zinc-900 rounded-2xl border border-zinc-800 text-xs font-bold">
              <button
                onClick={() => setProjectFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  projectFilter === 'all' ? 'bg-white text-zinc-950 font-black shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
              >
                همه ({toPersianDigits(projectTasks.length)})
              </button>
              <button
                onClick={() => setProjectFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  projectFilter === 'pending' ? 'bg-white text-zinc-950 font-black shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
              >
                در انتظار ({toPersianDigits(pendingTasks.length)})
              </button>
              <button
                onClick={() => setProjectFilter('completed')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  projectFilter === 'completed' ? 'bg-white text-zinc-950 font-black shadow-xs' : 'text-zinc-400 hover:text-white'
                }`}
              >
                تکمیل‌شده ({toPersianDigits(completedTasks.length)})
              </button>
            </div>
          </div>

          {displayedTasks.length === 0 ? (
            <div className="py-12 text-center p-8 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800 space-y-3">
              <FolderKanban className="w-8 h-8 text-zinc-500 mx-auto" />
              <p className="text-xs text-zinc-400">
                هیچ تسکی در این بخش وجود ندارد.
              </p>
              <button
                onClick={() => openCreateModal(undefined, undefined, selectedProject.id)}
                className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700/60 transition-all cursor-pointer"
              >
                افزودن اولین تسک پروژه
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedTasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // View: Grid of all Team Projects
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-6 bg-zinc-900/70 rounded-3xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-md">
            <FolderKanban className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">پروژه‌های تیمی</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              تسک‌ها را در پروژه‌های تیمی مشترک سازمان‌دهی کنید و پیشرفت اهداف را پیگیری نمایید.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateDialog}
          className="px-4 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>پروژه تیمی جدید</span>
        </button>
      </div>

      {/* Projects Bento Grid */}
      {projects.length === 0 ? (
        <div className="py-16 text-center p-8 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800 space-y-4">
          <FolderKanban className="w-10 h-10 text-zinc-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">هنوز هیچ پروژه تیمی ایجاد نشده است</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            با ایجاد اولین پروژه تیمی، می‌توانید تسک‌های مربوطه را به آن متصل کنید و پیشرفت کار گروهی را بسنجید.
          </p>
          <button
            onClick={openCreateDialog}
            className="px-5 py-2.5 rounded-2xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 cursor-pointer shadow-md inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد اولین پروژه تیمی</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const projectTasks = tasks.filter((t) => t.projectId === proj.id);
            const total = projectTasks.length;
            const done = projectTasks.filter((t) => t.completed).length;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;
            const canManage = currentUser?.role === 'admin' || proj.creatorId === currentUser?.id;

            return (
              <div
                key={proj.id}
                className="p-5 bg-zinc-900/70 hover:bg-zinc-900/90 rounded-3xl border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden backdrop-blur-xs"
              >
                {/* Accent top stripe */}
                <div
                  className="absolute top-0 right-0 left-0 h-1"
                  style={{ backgroundColor: proj.color || '#6366f1' }}
                />

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs flex-shrink-0"
                        style={{ backgroundColor: proj.color || '#6366f1' }}
                      >
                        {renderIcon(proj.icon, 'w-5 h-5')}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{proj.name}</h3>
                        <p className="text-[11px] text-zinc-400">
                          توسط {proj.creatorName}
                        </p>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(proj);
                          }}
                          className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="ویرایش پروژه"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(proj.id);
                          }}
                          className="p-1.5 rounded-xl hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="حذف پروژه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {proj.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-2 pt-1 border-t border-zinc-800/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">
                      {toPersianDigits(done)} از {toPersianDigits(total)} تسک تکمیل شده
                    </span>
                    <span className="font-mono font-bold text-zinc-200">{toPersianDigits(percent)}٪</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: proj.color || '#6366f1',
                      }}
                    />
                  </div>

                  {/* Footer Card */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <div className="flex -space-x-1.5 space-x-reverse overflow-hidden">
                      {proj.memberIds?.slice(0, 4).map((mId) => {
                        const u = users.find((user) => user.id === mId);
                        const name = u?.name || 'عضو';
                        return (
                          <div
                            key={mId}
                            title={name}
                            className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-900 text-white font-bold text-[10px] flex items-center justify-center"
                          >
                            {name.slice(0, 1)}
                          </div>
                        );
                      })}
                      {proj.memberIds && proj.memberIds.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-zinc-700 text-zinc-300 text-[9px] font-bold flex items-center justify-center">
                          +{toPersianDigits(proj.memberIds.length - 4)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedProject(proj)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>مشاهده تسک‌ها</span>
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                {editingProject ? 'ویرایش پروژه تیمی' : 'ایجاد پروژه تیمی جدید'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">نام پروژه تیمی *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: ریدیزاین وب‌سایت، کمپین پاییز..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">توضیحات یا اهداف پروژه</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="شرح مختصری از اهداف، مایلستون‌ها یا دستورالعمل‌ها..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-white text-xs outline-hidden focus:border-zinc-500 resize-none"
                />
              </div>

              {/* Color Selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">رنگ شاخص پروژه</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        color === c ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">آیکون پروژه</label>
                <div className="grid grid-cols-6 gap-2">
                  {PROJECT_ICONS.map((item) => {
                    const Comp = item.icon;
                    const isSelected = icon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIcon(item.id)}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white text-zinc-950 border-white font-bold'
                            : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50 hover:text-white'
                        }`}
                      >
                        <Comp className="w-4 h-4" />
                        <span className="text-[9px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Members Selection */}
              {users.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300">انتخاب اعضای تیم</label>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
                    {users.map((u) => {
                      const isChecked = selectedMembers.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          onClick={() => toggleMember(u.id)}
                          className="flex items-center justify-between p-1.5 rounded-xl hover:bg-zinc-800/80 cursor-pointer select-none text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-700 text-white font-bold flex items-center justify-center text-[10px]">
                              {u.name.slice(0, 1)}
                            </div>
                            <span className="text-white font-semibold">{u.name}</span>
                            <span className="text-[10px] text-zinc-400">(@{u.username})</span>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                              isChecked
                                ? 'bg-white border-white text-zinc-950'
                                : 'border-zinc-600 bg-zinc-800'
                            }`}
                          >
                            {isChecked && <UserCheck className="w-3.5 h-3.5" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-white text-zinc-950 font-black hover:bg-zinc-200 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ثبت...' : editingProject ? 'ذخیره تغییرات' : 'ایجاد پروژه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
