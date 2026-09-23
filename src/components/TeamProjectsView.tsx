import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import type { TeamProject, User, ProjectChatMessage } from '../types';
import { toPersianDigits } from '../utils/persianDate';
import { TaskCard } from './TaskCard';
import { UserAvatar } from './UserAvatar';
import { sounds } from '../utils/sound';
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
  MessageSquare,
  ListTodo,
  Send,
  UserPlus,
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
    friends,
    currentUser,
    createTeamProject,
    updateTeamProject,
    deleteTeamProject,
    openCreateModal,
    sendFriendRequest,
    isPro,
    setIsUpgradeModalOpen,
  } = useTask();

  const [selectedProject, setSelectedProject] = useState<TeamProject | null>(null);
  const [activeProjectTab, setActiveProjectTab] = useState<'tasks' | 'chat'>('tasks');
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
  const [invitedUserIds, setInvitedUserIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tasks within active project view
  const [projectFilter, setProjectFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Group chat states
  const [projectMessages, setProjectMessages] = useState<ProjectChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Search users live on server for invitation
  useEffect(() => {
    const q = memberSearchQuery.trim();
    if (!q) {
      setServerUserResults([]);
      return;
    }
    let active = true;
    api.searchUsers(q).then((res) => {
      if (active) setServerUserResults(res.filter((u) => u.id !== currentUser?.id));
    }).catch(() => {});
    return () => { active = false; };
  }, [memberSearchQuery, currentUser?.id]);

  // Load project messages
  const loadProjectMessages = async (pId: string) => {
    try {
      const msgs = await api.getProjectMessages(pId);
      setProjectMessages(msgs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!selectedProject || activeProjectTab !== 'chat') return;
    loadProjectMessages(selectedProject.id);
    const timer = setInterval(() => loadProjectMessages(selectedProject.id), 3000);
    return () => clearInterval(timer);
  }, [selectedProject?.id, activeProjectTab]);

  useEffect(() => {
    if (activeProjectTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [projectMessages, activeProjectTab]);

  const openCreateDialog = () => {
    if (!isPro) {
      const myCount = projects.filter((p) => p.creatorId === currentUser?.id).length;
      if (myCount >= 1) {
        setIsUpgradeModalOpen(true);
        sounds.playPop();
        return;
      }
    }
    setEditingProject(null);
    setName('');
    setDescription('');
    setColor('#6366f1');
    setIcon('FolderKanban');
    setSelectedMembers(currentUser ? [currentUser.id] : []);
    setMemberSearchQuery('');
    setInvitedUserIds(new Set());
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
    setInvitedUserIds(new Set());
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
          setSelectedProject((prev) =>
            prev ? { ...prev, name: name.trim(), description: description.trim(), color, icon, memberIds: selectedMembers } : null
          );
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
      alert(err.message || 'خطا در ثبت پروژه');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (userId: string) => {
    if (currentUser && userId === currentUser.id) return; // Creator cannot be removed
    sounds.playPop();
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSendProjectInvite = async (user: User) => {
    try {
      await sendFriendRequest(user.id, editingProject?.id, name || 'پروژه جدید');
      setInvitedUserIds((prev) => new Set([...prev, user.id]));
      sounds.playComplete();
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال دعوت به پروژه');
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedProject || isSendingMessage) return;

    sounds.playPop();
    const text = chatInput.trim();
    setChatInput('');
    setIsSendingMessage(true);

    // Optimistic message
    const tempMsg: ProjectChatMessage = {
      id: 'opt_' + Date.now(),
      projectId: selectedProject.id,
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.name || 'من',
      senderAvatar: currentUser?.avatar || null,
      text,
      createdAt: new Date().toISOString(),
    };
    setProjectMessages((prev) => [...prev, tempMsg]);

    try {
      const saved = await api.sendProjectMessage(selectedProject.id, text);
      setProjectMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? saved : m)));
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال پیام تیمی');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const renderIcon = (iconId: string, className = 'w-5 h-5') => {
    const item = PROJECT_ICONS.find((i) => i.id === iconId) || PROJECT_ICONS[0];
    const Comp = item.icon;
    return <Comp className={className} />;
  };

  // Filter friends based on query
  const filteredFriends = useMemo(() => {
    const q = memberSearchQuery.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.username.toLowerCase().includes(q) ||
        (f.numericId && String(f.numericId).includes(q))
    );
  }, [friends, memberSearchQuery]);

  // Non-friend users from server search
  const nonFriendResults = useMemo(() => {
    const friendIds = new Set(friends.map((f) => f.id));
    return serverUserResults.filter((u) => !friendIds.has(u.id) && u.id !== currentUser?.id);
  }, [serverUserResults, friends, currentUser?.id]);

  // View: Single Active Project Details (Tasks or Group Chat)
  if (selectedProject) {
    const projectTasks = tasks.filter((t) => t.projectId === selectedProject.id);
    const completedTasks = projectTasks.filter((t) => t.completed);
    const pendingTasks = projectTasks.filter((t) => !t.completed);
    const progress = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;

    let displayedTasks = projectTasks;
    if (projectFilter === 'completed') displayedTasks = completedTasks;
    if (projectFilter === 'pending') displayedTasks = pendingTasks;

    return (
      <div className="space-y-6 animate-in fade-in pb-16" dir="rtl">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-sm">
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>بازگشت به فهرست پروژه‌ها</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditDialog(selectedProject)}
              className="p-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
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
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-5 relative overflow-hidden">
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
                <h1 className="text-lg font-black text-slate-900 dark:text-white">{selectedProject.name}</h1>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  ایجاد شده توسط <span className="text-slate-700 dark:text-zinc-300 font-bold">{selectedProject.creatorName}</span>
                </p>
              </div>
            </div>

            {/* Team Members Avatars */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold ml-1">اعضای پروژه:</span>
              <div className="flex -space-x-2 space-x-reverse overflow-hidden">
                {selectedProject.memberIds?.map((mId) => {
                  const u = users.find((user) => user.id === mId) || friends.find((f) => f.id === mId);
                  const name = u?.name || 'عضو';
                  return (
                    <div
                      key={mId}
                      title={name}
                      className="w-8 h-8 rounded-full bg-slate-900 border-2 border-white dark:border-zinc-900 text-white font-bold text-xs flex items-center justify-center shadow-xs"
                    >
                      {name.slice(0, 1)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedProject.description && (
            <p className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 leading-relaxed font-medium">
              {selectedProject.description}
            </p>
          )}

          {/* Tab Switcher: Tasks vs Team Chat */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <button
              onClick={() => setActiveProjectTab('tasks')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeProjectTab === 'tasks'
                  ? 'bg-[#121212] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>تسک‌ها و پیشرفت ({toPersianDigits(projectTasks.length)})</span>
            </button>

            <button
              onClick={() => setActiveProjectTab('chat')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeProjectTab === 'chat'
                  ? 'bg-[#121212] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>گفتگوی گروهی اعضای تیم ({toPersianDigits(projectMessages.length)})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: TASKS & PROGRESS */}
        {activeProjectTab === 'tasks' && (
          <div className="space-y-6">
            {/* Stats Progress Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-2xs">
                <div className="text-[11px] text-slate-400 font-bold mb-1">کل تسک‌های پروژه</div>
                <div className="text-xl font-black text-slate-900 dark:text-white">{toPersianDigits(projectTasks.length)}</div>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-2xs">
                <div className="text-[11px] text-slate-400 font-bold mb-1">تسک‌های انجام شده</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{toPersianDigits(completedTasks.length)}</div>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 shadow-2xs">
                <div className="text-[11px] text-slate-400 font-bold mb-1">درصد پیشرفت تیمی</div>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">%{toPersianDigits(progress)}</div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProjectFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  projectFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                }`}
              >
                همه ({toPersianDigits(projectTasks.length)})
              </button>
              <button
                onClick={() => setProjectFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  projectFilter === 'pending'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                }`}
              >
                در حال انجام ({toPersianDigits(pendingTasks.length)})
              </button>
              <button
                onClick={() => setProjectFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  projectFilter === 'completed'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                }`}
              >
                تکمیل شده ({toPersianDigits(completedTasks.length)})
              </button>
            </div>

            {/* Tasks List */}
            {displayedTasks.length === 0 ? (
              <div className="py-16 text-center p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 space-y-3">
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">تسکی برای نمایش در این بخش وجود ندارد.</p>
                <button
                  onClick={() => openCreateModal(undefined, undefined, selectedProject.id)}
                  className="px-4 py-2 rounded-2xl bg-[#121212] text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت اولین تسک در پروژه</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TEAM PROJECT GROUP CHAT */}
        {activeProjectTab === 'chat' && (
          <div className="bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-200/90 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-[560px]">
            {/* Chat header notice */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 text-center text-[11px] text-slate-500 dark:text-zinc-400 font-bold">
              فضای گفتگوی زنده اعضای پروژه «{selectedProject.name}»
            </div>

            {/* Chat messages history */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]/50 dark:bg-zinc-950/30">
              {projectMessages.length === 0 ? (
                <div className="py-20 text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600" />
                  <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">هنوز گفتگویی در این پروژه آغاز نشده است.</p>
                  <p className="text-[11px] text-slate-400">اولین پیام یا به‌روزرسانی کار تیمی را بنویسید.</p>
                </div>
              ) : (
                projectMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}>
                      {!isMe && (
                        <div className="text-[10px] text-slate-400 font-bold mb-0.5 mr-1 flex items-center gap-1">
                          <span>{msg.senderName}</span>
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed space-y-1 shadow-2xs ${
                          isMe
                            ? 'bg-[#121212] dark:bg-white text-white dark:text-zinc-900 rounded-br-xs'
                            : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200/80 dark:border-zinc-700 rounded-bl-xs'
                        }`}
                      >
                        <p className="font-bold">{msg.text}</p>
                        <span className="block text-[9px] font-mono opacity-70 text-left dir-ltr">
                          {timeStr}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="پیامی برای همکاران این پروژه بنویسید..."
                className="flex-1 bg-[#f8fafc] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-slate-800 dark:focus:border-zinc-600 font-bold shadow-inner"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSendingMessage}
                className="p-2.5 rounded-2xl bg-[#121212] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 cursor-pointer disabled:opacity-40 transition-colors flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // View: Grid of all Team Projects
  return (
    <div className="space-y-6 animate-in fade-in pb-16" dir="rtl">
      {/* Header Banner */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-200/90 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#121212] text-white flex items-center justify-center shadow-xs">
            <FolderKanban className="w-6 h-6 stroke-[2.5] text-[#00b884]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                پروژه‌های تیمی
              </h2>
              {!isPro && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                  پلن رایگان (سقف ۱ پروژه)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              دسته‌بندی، چت گروهی، برنامه‌ریزی تیمی و اشتراک‌گذاری تسک‌ها میان همکاران
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
        <div className="py-16 text-center p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 space-y-4">
          <FolderKanban className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">هنوز هیچ پروژه تیمی ایجاد نشده است</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            با ایجاد اولین پروژه تیمی، می‌توانید همکاران را دعوت کرده، تسک‌های مربوطه را به آن متصل کنید و چت تیمی داشته باشید.
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
                className="p-5 bg-white dark:bg-zinc-900 hover:bg-slate-50/80 dark:hover:bg-zinc-800/60 rounded-[28px] border border-slate-200/90 dark:border-zinc-800 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden shadow-2xs"
              >
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
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{proj.name}</h3>
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
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                          title="ویرایش پروژه"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`آیا از حذف پروژه تیمی «${proj.name}» اطمینان دارید؟`)) {
                              deleteTeamProject(proj.id);
                            }
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
                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">
                      {toPersianDigits(done)} از {toPersianDigits(total)} تسک تکمیل شده
                    </span>
                    <span className="font-mono font-black text-slate-700 dark:text-zinc-300">{toPersianDigits(percent)}٪</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: proj.color || '#6366f1',
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Footer */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center -space-x-1.5 space-x-reverse">
                    {proj.memberIds?.slice(0, 4).map((mId) => {
                      const u = users.find((user) => user.id === mId) || friends.find((f) => f.id === mId);
                      const name = u?.name || 'عضو';
                      return (
                        <div
                          key={mId}
                          title={name}
                          className="w-6 h-6 rounded-full bg-slate-900 border-2 border-white dark:border-zinc-900 text-white font-bold text-[10px] flex items-center justify-center shadow-xs"
                        >
                          {name.slice(0, 1)}
                        </div>
                      );
                    })}
                    {proj.memberIds && proj.memberIds.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 text-slate-600 dark:text-zinc-300 text-[9px] font-black flex items-center justify-center">
                        +{toPersianDigits(proj.memberIds.length - 4)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProject(proj);
                      setActiveProjectTab('tasks');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>ورود به پروژه</span>
                    <ArrowRight className="w-3 h-3 rotate-180" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL: ONLY FRIENDS + INVITATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-2xl border border-slate-200/90 dark:border-zinc-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-500" />
                {editingProject ? 'ویرایش پروژه تیمی' : 'ایجاد پروژه تیمی جدید'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-zinc-300">نام پروژه تیمی *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: پروژه تولید محتوا یا توسعه وب‌سایت"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f8fafc] dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 text-slate-800 dark:text-white text-xs outline-none focus:border-slate-800 dark:focus:border-zinc-600 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-zinc-300">توضیحات یا اهداف پروژه</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="شرح مختصری از اهداف، مایلستون‌ها یا دستورالعمل‌ها..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#f8fafc] dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 text-slate-800 dark:text-white text-xs outline-none focus:border-slate-800 dark:focus:border-zinc-600 resize-none font-medium"
                />
              </div>

              {/* Color Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-zinc-300">رنگ شاخص پروژه</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        color === c ? 'scale-115 ring-2 ring-slate-800 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-zinc-900' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-zinc-300">آیکون پروژه</label>
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
                            ? 'bg-[#121212] dark:bg-white text-white dark:text-zinc-900 border-[#121212] font-black shadow-xs'
                            : 'bg-[#f8fafc] dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:text-black dark:hover:text-white hover:bg-slate-100'
                        }`}
                      >
                        <Comp className="w-4 h-4" />
                        <span className="text-[9px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MEMBERS SELECTION: ONLY FRIENDS + PROJECT INVITATION */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <span>انتخاب اعضای پروژه تیمی</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">(فقط همکاران متصل)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {toPersianDigits(selectedMembers.length)} عضو انتخاب شده
                  </span>
                </div>

                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="جستجو میان همکاران یا ارسال دعوت به کاربر جدید..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f8fafc] dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 text-slate-800 dark:text-white text-xs outline-none focus:border-slate-800 dark:focus:border-zinc-600 font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>

                {/* Selected Members Chips */}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedMembers.map((mId) => {
                      const u = users.find((user) => user.id === mId) || friends.find((f) => f.id === mId);
                      const uName = u?.name || (mId === currentUser?.id ? currentUser.name : 'کاربر');
                      const isSelf = currentUser && mId === currentUser.id;
                      return (
                        <span
                          key={mId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-[11px] font-bold border border-slate-200 dark:border-zinc-700 shadow-2xs"
                        >
                          <span>{uName}</span>
                          {isSelf && <span className="text-[9px] text-emerald-600 font-bold">(شما / سازنده)</span>}
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

                {/* Friends Selectable List (User constraint: ONLY friends previously added can be added directly) */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                    همکاران شما ({toPersianDigits(filteredFriends.length)} نفر):
                  </div>

                  {friends.length === 0 ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                      <p className="font-bold">هنوز هیچ همکاری در لیست دوستان شما قرار ندارد.</p>
                      <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                        برای افزودن اعضا به این پروژه، ابتدا با آنها ارتباط دوستی برقرار کنید یا از کادر زیر برایشان دعوت‌نامه ارسال نمایید.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-[#f8fafc] dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800">
                      {filteredFriends.map((f) => {
                        const isChecked = selectedMembers.includes(f.id);
                        return (
                          <div
                            key={f.id}
                            onClick={() => toggleMember(f.id)}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer select-none text-xs transition-colors ${
                              isChecked
                                ? 'bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 shadow-2xs font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <UserAvatar user={f} size="sm" className="w-7 h-7" />
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">{f.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono mr-1.5">(@{f.username})</span>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                                isChecked
                                  ? 'bg-[#121212] dark:bg-white border-[#121212] dark:border-white text-white dark:text-zinc-900'
                                  : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Non-friend search results (Invitation flow) */}
                {memberSearchQuery.trim() && nonFriendResults.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-zinc-800">
                    <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>کاربران خارج از لیست همکاران (ارسال دعوت به پروژه و دوستی):</span>
                    </div>

                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {nonFriendResults.map((u) => {
                        const isInvited = invitedUserIds.has(u.id);
                        return (
                          <div
                            key={u.id}
                            className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <UserAvatar user={u} size="sm" className="w-7 h-7" />
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white truncate">{u.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono mr-1">(@{u.username})</span>
                              </div>
                            </div>

                            {isInvited ? (
                              <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                                دعوت ارسال شد ⏳
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendProjectInvite(u)}
                                className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>ارسال دعوت</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-slate-600 dark:text-zinc-400 font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-6 py-2.5 rounded-2xl bg-[#121212] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-black shadow-md transition-all cursor-pointer disabled:opacity-40"
                >
                  {isSubmitting ? 'در حال ثبت...' : editingProject ? 'ذخیره تغییرات' : 'ایجاد پروژه تیمی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
