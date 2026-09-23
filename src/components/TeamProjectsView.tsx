import React, { useState, useEffect, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import type { TeamProject, User } from '../types';
import { toPersianDigits } from '../utils/persianDate';
import { TaskCard } from './TaskCard';
import { UserAvatar } from './UserAvatar';
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
  Check,
  Search,
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
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [serverUserResults, setServerUserResults] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tasks within active project view
  const [projectFilter, setProjectFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Search users live on the server
  useEffect(() => {
    const q = memberSearchQuery.trim().toLowerCase();
    if (q.length < 1) {
      setServerUserResults([]);
      return;
    }
    let active = true;
    api.searchUsers(q).then((res) => {
      if (active) setServerUserResults(res);
    }).catch(() => {});
    return () => { active = false; };
  }, [memberSearchQuery]);

  const candidateUsers = useMemo(() => {
    const q = memberSearchQuery.trim().toLowerCase();
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    serverUserResults.forEach((u) => map.set(u.id, u));
    const all = Array.from(map.values());
    if (!q) return all;
    return all.filter((u) =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(q))
    );
  }, [users, serverUserResults, memberSearchQuery]);

  const openCreateDialog = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setColor('#6366f1');
    setIcon('FolderKanban');
    setSelectedMembers(currentUser ? [currentUser.id] : []);
    setMemberSearchQuery('');
    setIsModalOpen(true);
  };

  const openEditDialog = (proj: TeamProject) => {
    setEditingProject(proj);
    setName(proj.name);
    setDescription(proj.description || '');
    setColor(proj.color || '#6366f1');
    setIcon(proj.icon || 'FolderKanban');
    setSelectedMembers(proj.memberIds || []);
    setMemberSearchQuery('');
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
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره پروژه تیمی');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('آیا از حذف این پروژه تیمی اطمینان دارید؟ تسک‌های متصل حفظ خواهند شد.')) {
      await deleteTeamProject(id);
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const renderIcon = (iconId: string, className = 'w-5 h-5') => {
    const item = PROJECT_ICONS.find((i) => i.id === iconId) || PROJECT_ICONS[0];
    const Comp = item.icon;
    return <Comp className={className} />;
  };

  // View: Single Active Project Details
  if (selectedProject) {
    const projectTasks = tasks.filter((t) => t.projectId === selectedProject.id);
    const completedTasks = projectTasks.filter((t) => t.completed);
    const pendingTasks = projectTasks.filter((t) => !t.completed);
    const progress = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;

    let displayedTasks = projectTasks;
    if (projectFilter === 'completed') displayedTasks = completedTasks;
    if (projectFilter === 'pending') displayedTasks = pendingTasks;

    return (
      <div className="space-y-6 animate-in fade-in pb-16">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm">
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-1.5 text-xs font-black text-slate-700 hover:text-black transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>بازگشت به فهرست پروژه‌ها</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditDialog(selectedProject)}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="ویرایش پروژه"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => openCreateModal(undefined, undefined, selectedProject.id)}
              className="px-4 py-2 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>تسک جدید در پروژه</span>
            </button>
          </div>
        </div>

        {/* Project Header Banner */}
        <div className="p-6 bg-white rounded-[28px] border border-slate-200/90 shadow-sm space-y-5 relative overflow-hidden">
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
                <h1 className="text-lg font-black text-slate-900">{selectedProject.name}</h1>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  ایجاد شده توسط <span className="text-slate-700 font-bold">{selectedProject.creatorName}</span>
                </p>
              </div>
            </div>

            {/* Team Members Avatars */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold ml-1">اعضای پروژه:</span>
              <div className="flex -space-x-2 space-x-reverse overflow-hidden">
                {selectedProject.memberIds?.map((mId) => {
                  const u = users.find((user) => user.id === mId) || serverUserResults.find((user) => user.id === mId);
                  const name = u?.name || 'عضو';
                  return (
                    <div
                      key={mId}
                      title={name}
                      className="w-8 h-8 rounded-full bg-slate-900 border-2 border-white text-white font-black text-xs flex items-center justify-center shadow-xs"
                    >
                      {name.slice(0, 1)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedProject.description && (
            <p className="text-xs text-slate-600 leading-relaxed bg-[#f8fafc] p-3 rounded-2xl border border-slate-200/70">
              {selectedProject.description}
            </p>
          )}

          {/* Progress Overview Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">
                پیشرفت کل پروژه ({toPersianDigits(completedTasks.length)} از {toPersianDigits(projectTasks.length)} تسک)
              </span>
              <span className="font-mono font-black text-slate-800">{toPersianDigits(progress)}٪</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
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
            <div className="inline-flex p-1 bg-white rounded-2xl border border-slate-200/90 text-xs font-bold shadow-2xs">
              <button
                onClick={() => setProjectFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  projectFilter === 'all' ? 'bg-[#121212] text-white font-black shadow-xs' : 'text-slate-500 hover:text-black'
                }`}
              >
                همه ({toPersianDigits(projectTasks.length)})
              </button>
              <button
                onClick={() => setProjectFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  projectFilter === 'pending' ? 'bg-[#121212] text-white font-black shadow-xs' : 'text-slate-500 hover:text-black'
                }`}
              >
                در انتظار ({toPersianDigits(pendingTasks.length)})
              </button>
              <button
                onClick={() => setProjectFilter('completed')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  projectFilter === 'completed' ? 'bg-[#121212] text-white font-black shadow-xs' : 'text-slate-500 hover:text-black'
                }`}
              >
                تکمیل‌شده ({toPersianDigits(completedTasks.length)})
              </button>
            </div>
          </div>

          {displayedTasks.length === 0 ? (
            <div className="py-12 text-center p-8 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <FolderKanban className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 font-bold">
                هیچ تسکی در این بخش وجود ندارد.
              </p>
              <button
                onClick={() => openCreateModal(undefined, undefined, selectedProject.id)}
                className="px-4 py-2 rounded-2xl bg-[#121212] hover:bg-black text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
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
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Header Banner */}
      <div className="p-6 bg-white rounded-[28px] border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#121212] text-white flex items-center justify-center shadow-xs">
            <FolderKanban className="w-6 h-6 stroke-[2.5] text-[#00b884]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              پروژه‌های تیمی
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              دسته‌بندی، برنامه‌ریزی تیمی و اشتراک‌گذاری تسک‌ها میان همکاران
            </p>
          </div>
        </div>

        <button
          onClick={openCreateDialog}
          className="px-4 py-2.5 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>پروژه تیمی جدید</span>
        </button>
      </div>

      {/* Projects Bento Grid */}
      {projects.length === 0 ? (
        <div className="py-16 text-center p-8 bg-white rounded-3xl border border-dashed border-slate-200 space-y-4">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-black text-slate-800">هنوز هیچ پروژه تیمی ایجاد نشده است</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            با ایجاد اولین پروژه تیمی، می‌توانید تسک‌های مربوطه را به آن متصل کنید و پیشرفت کار گروهی را بسنجید.
          </p>
          <button
            onClick={openCreateDialog}
            className="px-5 py-2.5 rounded-2xl bg-[#121212] hover:bg-black text-white font-black text-xs cursor-pointer shadow-md inline-flex items-center gap-2"
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
                className="p-5 bg-white hover:bg-slate-50/80 rounded-[28px] border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden shadow-2xs"
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
                        <h3 className="text-sm font-black text-slate-900 truncate">{proj.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">
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
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                          title="ویرایش پروژه"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(proj.id);
                          }}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="حذف پروژه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {proj.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {proj.description}
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">
                      {toPersianDigits(done)} از {toPersianDigits(total)} تسک تکمیل شده
                    </span>
                    <span className="font-mono font-black text-slate-700">{toPersianDigits(percent)}٪</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: proj.color || '#6366f1',
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Footer: Member Avatars & Action */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center -space-x-1.5 space-x-reverse">
                    {proj.memberIds?.slice(0, 4).map((mId) => {
                      const u = users.find((user) => user.id === mId) || serverUserResults.find((user) => user.id === mId);
                      const name = u?.name || 'عضو';
                      return (
                        <div
                          key={mId}
                          title={name}
                          className="w-6 h-6 rounded-full bg-slate-900 border-2 border-white text-white font-bold text-[10px] flex items-center justify-center shadow-xs"
                        >
                          {name.slice(0, 1)}
                        </div>
                      );
                    })}
                    {proj.memberIds && proj.memberIds.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white text-slate-600 text-[9px] font-black flex items-center justify-center">
                        +{toPersianDigits(proj.memberIds.length - 4)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedProject(proj)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>مشاهده تسک‌ها</span>
                    <ArrowRight className="w-3 h-3 rotate-180" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal with Username Search & Invite */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[32px] p-6 shadow-2xl border border-slate-200/90 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-500" />
                {editingProject ? 'ویرایش پروژه تیمی' : 'ایجاد پروژه تیمی جدید'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">نام پروژه تیمی *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: ریدیزاین وب‌سایت، کمپین پاییز..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 text-slate-800 text-xs outline-none focus:border-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">توضیحات یا اهداف پروژه</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="شرح مختصری از اهداف، مایلستون‌ها یا دستورالعمل‌ها..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 text-slate-800 text-xs outline-none focus:border-slate-800 resize-none font-medium"
                />
              </div>

              {/* Color Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">رنگ شاخص پروژه</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        color === c ? 'scale-115 ring-2 ring-slate-800 ring-offset-2 ring-offset-white' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">آیکون پروژه</label>
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
                            ? 'bg-[#121212] text-white border-[#121212] font-black shadow-xs'
                            : 'bg-[#f8fafc] text-slate-500 border-slate-200 hover:text-black hover:bg-slate-100'
                        }`}
                      >
                        <Comp className="w-4 h-4" />
                        <span className="text-[9px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Members Selection with Username Search & Invite */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>انتخاب و دعوت اعضای تیم</span>
                  <span className="text-[10px] text-slate-400 font-normal">با نام کاربری یا نام جستجو کنید</span>
                </label>

                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="جستجو با نام کاربری (@username یا نام شخص)..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 text-slate-800 text-xs outline-none focus:border-slate-800 font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>

                {/* Selected Members Chips */}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedMembers.map((mId) => {
                      const u = users.find((user) => user.id === mId) || serverUserResults.find((user) => user.id === mId);
                      const uName = u?.name || 'کاربر';
                      const isSelf = currentUser && mId === currentUser.id;
                      return (
                        <span
                          key={mId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200 shadow-2xs"
                        >
                          <span>{uName}</span>
                          {u?.username && (
                            <span className="text-[10px] text-slate-400 font-mono">(@{u.username})</span>
                          )}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => toggleMember(mId)}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Candidates List */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                  {candidateUsers.map((u) => {
                    const isChecked = selectedMembers.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleMember(u.id)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer select-none text-xs transition-colors ${
                          isChecked
                            ? 'bg-white border border-slate-300 shadow-2xs font-bold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <UserAvatar name={u.name} avatar={u.avatar} size="w-7 h-7 rounded-full text-[10px]" />
                          <div>
                            <span className="font-bold text-slate-900">{u.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono mr-1.5">(@{u.username})</span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-[#121212] border-[#121212] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                  {candidateUsers.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs font-bold">
                      کاربری برای نمایش یافت نشد.
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#121212] text-white font-black hover:bg-black cursor-pointer shadow-md disabled:opacity-50"
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
