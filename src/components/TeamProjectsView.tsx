import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { api } from '../services/api';
import type { TeamProject, User, ProjectChatMessage, Task, Priority } from '../types';
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
  Kanban,
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  ExternalLink,
  Filter,
  CheckSquare,
  Link2,
  ChevronRight,
  TrendingUp,
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
  '#007aff', // Apple Blue
  '#34c759', // Apple Green
  '#5856d6', // Apple Purple
  '#ff9500', // Apple Orange
  '#ff2d55', // Apple Pink
  '#af52de', // Apple Violet
  '#30b0c7', // Apple Cyan
  '#ff3b30', // Apple Red
];

interface ProjectMilestone {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
  notes?: string;
}

interface ProjectResource {
  id: string;
  title: string;
  url: string;
  category: 'figma' | 'github' | 'drive' | 'doc' | 'other';
  createdAt: string;
}

type ProjectViewTab = 'tasks' | 'kanban' | 'milestones' | 'members' | 'chat' | 'resources';

export const TeamProjectsView: React.FC = () => {
  const {
    projects,
    tasks,
    users,
    friends,
    currentUser,
    categories,
    createTeamProject,
    updateTeamProject,
    deleteTeamProject,
    openCreateModal,
    sendFriendRequest,
    isPro,
    setIsUpgradeModalOpen,
    addTask,
    toggleTaskComplete,
  } = useTask();

  const [selectedProject, setSelectedProject] = useState<TeamProject | null>(null);
  const [activeProjectTab, setActiveProjectTab] = useState<ProjectViewTab>('tasks');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<TeamProject | null>(null);

  // Search & Filter in Projects Overview
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'all' | 'mine' | 'shared' | 'completed' | 'active'>('all');

  // Form states for creating / editing projects
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#007aff');
  const [icon, setIcon] = useState('FolderKanban');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [serverUserResults, setServerUserResults] = useState<User[]>([]);
  const [invitedUserIds, setInvitedUserIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters within active project tasks
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<string>('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('all');

  // Inline Quick Add Task within project
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<Priority>('medium');
  const [quickTaskAssignee, setQuickTaskAssignee] = useState<string>(currentUser?.id || '');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Kanban column status overrides (saved per project)
  const [kanbanOverrides, setKanbanOverrides] = useState<Record<string, 'todo' | 'in_progress' | 'review' | 'done'>>({});

  // Milestones State (per project)
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [newMilestoneNotes, setNewMilestoneNotes] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  // Resources State (per project)
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceCategory, setNewResourceCategory] = useState<'figma' | 'github' | 'drive' | 'doc' | 'other'>('other');
  const [showAddResource, setShowAddResource] = useState(false);

  // Group chat states
  const [projectMessages, setProjectMessages] = useState<ProjectChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load project milestones & resources when a project is selected
  useEffect(() => {
    if (!selectedProject) return;
    try {
      const savedMilestones = localStorage.getItem(`taskrooz_milestones_${selectedProject.id}`);
      if (savedMilestones) setMilestones(JSON.parse(savedMilestones));
      else setMilestones([]);

      const savedResources = localStorage.getItem(`taskrooz_resources_${selectedProject.id}`);
      if (savedResources) setResources(JSON.parse(savedResources));
      else setResources([]);

      const savedKanban = localStorage.getItem(`taskrooz_kanban_${selectedProject.id}`);
      if (savedKanban) setKanbanOverrides(JSON.parse(savedKanban));
      else setKanbanOverrides({});
    } catch {
      // ignore
    }
    setQuickTaskAssignee(currentUser?.id || '');
  }, [selectedProject?.id, currentUser?.id]);

  // Persist Milestones
  const saveMilestones = (updated: ProjectMilestone[]) => {
    setMilestones(updated);
    if (selectedProject) {
      try {
        localStorage.setItem(`taskrooz_milestones_${selectedProject.id}`, JSON.stringify(updated));
      } catch {}
    }
  };

  // Persist Resources
  const saveResources = (updated: ProjectResource[]) => {
    setResources(updated);
    if (selectedProject) {
      try {
        localStorage.setItem(`taskrooz_resources_${selectedProject.id}`, JSON.stringify(updated));
      } catch {}
    }
  };

  // Persist Kanban Status Overrides
  const saveKanbanStatus = (taskId: string, status: 'todo' | 'in_progress' | 'review' | 'done') => {
    const next = { ...kanbanOverrides, [taskId]: status };
    setKanbanOverrides(next);
    if (selectedProject) {
      try {
        localStorage.setItem(`taskrooz_kanban_${selectedProject.id}`, JSON.stringify(next));
      } catch {}
    }
  };

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
    setColor('#007aff');
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
    setColor(proj.color || '#007aff');
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
        setEditingProject(null);
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
      sounds.playComplete();
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
      await sendFriendRequest(user.id, editingProject?.id || selectedProject?.id, name || selectedProject?.name || 'پروژه تیمی');
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

  // Inline Quick Add Task to active project
  const handleInlineQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || !selectedProject || isQuickAdding) return;

    setIsQuickAdding(true);
    sounds.playPop();
    try {
      const today = new Date().toISOString().split('T')[0];
      const defaultCategory = categories[0]?.id || 'cat_work';
      await addTask({
        title: quickTaskTitle.trim(),
        date: today,
        priority: quickTaskPriority,
        categoryId: defaultCategory,
        projectId: selectedProject.id,
        completed: false,
        subtasks: [],
        userId: quickTaskAssignee || currentUser?.id,
      });
      setQuickTaskTitle('');
      sounds.playComplete();
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت تسک');
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Move task to a specific Kanban column
  const handleMoveKanban = async (task: Task, targetColumn: 'todo' | 'in_progress' | 'review' | 'done') => {
    sounds.playPop();
    saveKanbanStatus(task.id, targetColumn);
    if (targetColumn === 'done' && !task.completed) {
      await toggleTaskComplete(task.id);
      sounds.playComplete();
    } else if (targetColumn !== 'done' && task.completed) {
      await toggleTaskComplete(task.id);
    }
  };

  // Milestone Add
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !selectedProject) return;
    sounds.playPop();
    const newM: ProjectMilestone = {
      id: 'ms_' + Date.now(),
      title: newMilestoneTitle.trim(),
      dueDate: newMilestoneDate || undefined,
      notes: newMilestoneNotes.trim() || undefined,
      completed: false,
    };
    saveMilestones([...milestones, newM]);
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
    setNewMilestoneNotes('');
    setShowAddMilestone(false);
    sounds.playComplete();
  };

  const handleToggleMilestone = (mId: string) => {
    sounds.playPop();
    const updated = milestones.map((m) => (m.id === mId ? { ...m, completed: !m.completed } : m));
    saveMilestones(updated);
  };

  const handleDeleteMilestone = (mId: string) => {
    sounds.playTrash();
    const updated = milestones.filter((m) => m.id !== mId);
    saveMilestones(updated);
  };

  // Resource Add
  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceTitle.trim() || !newResourceUrl.trim() || !selectedProject) return;
    sounds.playPop();
    let url = newResourceUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const newR: ProjectResource = {
      id: 'res_' + Date.now(),
      title: newResourceTitle.trim(),
      url,
      category: newResourceCategory,
      createdAt: new Date().toISOString(),
    };
    saveResources([...resources, newR]);
    setNewResourceTitle('');
    setNewResourceUrl('');
    setShowAddResource(false);
    sounds.playComplete();
  };

  const handleDeleteResource = (rId: string) => {
    sounds.playTrash();
    const updated = resources.filter((r) => r.id !== rId);
    saveResources(updated);
  };

  const renderIcon = (iconId: string, className = 'w-5 h-5') => {
    const item = PROJECT_ICONS.find((i) => i.id === iconId) || PROJECT_ICONS[0];
    const Comp = item.icon;
    return <Comp className={className} />;
  };

  // Filter friends based on query for project modal
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

  const nonFriendResults = useMemo(() => {
    const friendIds = new Set(friends.map((f) => f.id));
    return serverUserResults.filter((u) => !friendIds.has(u.id) && u.id !== currentUser?.id);
  }, [serverUserResults, friends, currentUser?.id]);

  // Projects visible to current user
  const myVisibleProjects = useMemo(() => {
    return projects.filter((proj) => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin') return true;
      if (proj.creatorId === currentUser.id) return true;
      const memberIds = Array.isArray(proj.memberIds) ? proj.memberIds : [];
      return memberIds.includes(currentUser.id) || (currentUser.username && memberIds.includes(currentUser.username));
    });
  }, [projects, currentUser]);

  // Filtered projects in main list
  const filteredProjects = useMemo(() => {
    return myVisibleProjects.filter((proj) => {
      const q = projectSearchQuery.trim().toLowerCase();
      if (q && !proj.name.toLowerCase().includes(q) && !(proj.description || '').toLowerCase().includes(q)) {
        return false;
      }
      const projectTasks = tasks.filter((t) => t.projectId === proj.id);
      const done = projectTasks.filter((t) => t.completed).length;
      const total = projectTasks.length;
      const isCompleted = total > 0 && done === total;

      if (projectStatusFilter === 'mine') return proj.creatorId === currentUser?.id;
      if (projectStatusFilter === 'shared') return proj.creatorId !== currentUser?.id;
      if (projectStatusFilter === 'completed') return isCompleted;
      if (projectStatusFilter === 'active') return !isCompleted;
      return true;
    });
  }, [myVisibleProjects, projectSearchQuery, projectStatusFilter, tasks, currentUser]);

  // Overall Statistics across all projects
  const overallStats = useMemo(() => {
    let totalProjectTasks = 0;
    let completedProjectTasks = 0;
    const projectIds = new Set(myVisibleProjects.map((p) => p.id));
    tasks.forEach((t) => {
      if (t.projectId && projectIds.has(t.projectId)) {
        totalProjectTasks++;
        if (t.completed) completedProjectTasks++;
      }
    });
    const avgProgress = totalProjectTasks > 0 ? Math.round((completedProjectTasks / totalProjectTasks) * 100) : 0;
    const totalMembersCount = new Set(myVisibleProjects.flatMap((p) => p.memberIds || [])).size;
    return { totalProjectTasks, completedProjectTasks, avgProgress, totalMembersCount };
  }, [myVisibleProjects, tasks]);

  // ==========================================
  // VIEW: SINGLE ACTIVE PROJECT WORKSPACE
  // ==========================================
  if (selectedProject) {
    const projectTasks = tasks.filter((t) => t.projectId === selectedProject.id);
    const completedTasks = projectTasks.filter((t) => t.completed);
    const pendingTasks = projectTasks.filter((t) => !t.completed);
    const progress = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;

    // Filter tasks based on filters in list view
    const displayedTasks = projectTasks.filter((t) => {
      if (taskStatusFilter === 'completed' && !t.completed) return false;
      if (taskStatusFilter === 'pending' && t.completed) return false;
      if (taskAssigneeFilter !== 'all' && t.userId !== taskAssigneeFilter) return false;
      if (taskPriorityFilter !== 'all' && t.priority !== taskPriorityFilter) return false;
      return true;
    });

    // Helper to get effective column for a task in Kanban
    const getTaskColumn = (task: Task): 'todo' | 'in_progress' | 'review' | 'done' => {
      if (kanbanOverrides[task.id]) return kanbanOverrides[task.id];
      if (task.completed) return 'done';
      return 'todo';
    };

    // Kanban columns data
    const kanbanColumns = {
      todo: projectTasks.filter((t) => getTaskColumn(t) === 'todo'),
      in_progress: projectTasks.filter((t) => getTaskColumn(t) === 'in_progress'),
      review: projectTasks.filter((t) => getTaskColumn(t) === 'review'),
      done: projectTasks.filter((t) => getTaskColumn(t) === 'done'),
    };

    return (
      <div className="space-y-6 animate-in fade-in pb-20 select-none" dir="rtl">
        {/* TOP BAR / BREADCRUMB */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#1c1c1e] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playPop();
                setSelectedProject(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
              <span>پروژه‌ها</span>
            </button>
            <span className="text-slate-300 dark:text-zinc-600 font-bold">/</span>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedProject.color || '#007aff' }}
              />
              <span className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[200px]">
                {selectedProject.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                sounds.playPop();
                openEditDialog(selectedProject);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="تنظیمات و اعضای پروژه"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>تنظیمات</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                openCreateModal(undefined, undefined, selectedProject.id);
              }}
              className="px-4 py-2 rounded-xl bg-[#007aff] hover:bg-[#0071e3] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>تسک جدید با جزئیات</span>
            </button>
          </div>
        </div>

        {/* PROJECT SPOTLIGHT HERO BANNER */}
        <div className="p-6 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-5 relative overflow-hidden">
          <div
            className="absolute top-0 right-0 left-0 h-1.5"
            style={{ backgroundColor: selectedProject.color || '#007aff' }}
          />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
                style={{ backgroundColor: selectedProject.color || '#007aff' }}
              >
                {renderIcon(selectedProject.icon, 'w-7 h-7')}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {selectedProject.name}
                  </h1>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    فعال
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  سازنده: <span className="font-bold text-slate-700 dark:text-zinc-200">{selectedProject.creatorName}</span>
                </p>
              </div>
            </div>

            {/* Quick KPIs */}
            <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
              <div className="p-3 px-4 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] min-w-[110px] text-center">
                <div className="text-[10px] font-bold text-slate-400">کل تسک‌ها</div>
                <div className="text-base font-black text-slate-800 dark:text-white mt-0.5">
                  {toPersianDigits(projectTasks.length)}
                </div>
              </div>

              <div className="p-3 px-4 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] min-w-[110px] text-center">
                <div className="text-[10px] font-bold text-slate-400">تکمیل‌شده</div>
                <div className="text-base font-black text-[#34c759] mt-0.5">
                  {toPersianDigits(completedTasks.length)}
                </div>
              </div>

              <div className="p-3 px-4 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] min-w-[110px] text-center">
                <div className="text-[10px] font-bold text-slate-400">پیشرفت کل</div>
                <div className="text-base font-black text-[#007aff] mt-0.5 font-mono">
                  {toPersianDigits(progress)}٪
                </div>
              </div>
            </div>
          </div>

          {selectedProject.description && (
            <p className="text-xs text-slate-600 dark:text-zinc-300 bg-[#f9f9fb] dark:bg-[#2c2c2e]/40 p-3.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] leading-relaxed font-medium">
              {selectedProject.description}
            </p>
          )}

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-zinc-400">
              <span>میزان تحقق اهداف پروژه</span>
              <span className="font-mono">{toPersianDigits(completedTasks.length)} از {toPersianDigits(projectTasks.length)} کار انجام شد</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: selectedProject.color || '#007aff',
                }}
              />
            </div>
          </div>

          {/* PROJECT VIEW SWITCHER TABS */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                sounds.playPop();
                setActiveProjectTab('tasks');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                activeProjectTab === 'tasks'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>فهرست تسک‌ها ({toPersianDigits(projectTasks.length)})</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                setActiveProjectTab('kanban');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                activeProjectTab === 'kanban'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>برد کانبان تیمی</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                setActiveProjectTab('milestones');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                activeProjectTab === 'milestones'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-amber-500" />
              <span>مایلستون‌ها و فازها ({toPersianDigits(milestones.length)})</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                setActiveProjectTab('members');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                activeProjectTab === 'members'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>اعضا و تقسیم کار ({toPersianDigits(selectedProject.memberIds?.length || 1)})</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                setActiveProjectTab('chat');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                activeProjectTab === 'chat'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>گفتگوی تیمی ({toPersianDigits(projectMessages.length)})</span>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                setActiveProjectTab('resources');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                activeProjectTab === 'resources'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-sky-500" />
              <span>اسناد و لینک‌ها ({toPersianDigits(resources.length)})</span>
            </button>
          </div>
        </div>

        {/* =========================================
            TAB 1: STRUCTURED TASKS LIST VIEW
        ========================================= */}
        {activeProjectTab === 'tasks' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Inline Fast Quick Add Bar */}
            <form
              onSubmit={handleInlineQuickAddTask}
              className="p-3.5 bg-white dark:bg-[#1c1c1e] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row items-center gap-2.5"
            >
              <div className="flex items-center gap-2 w-full flex-1">
                <Plus className="w-4 h-4 text-[#007aff] flex-shrink-0" />
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="ثبت سریع کار جدید در این پروژه... (با فشردن Enter)"
                  className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Priority Selector */}
                <select
                  value={quickTaskPriority}
                  onChange={(e) => setQuickTaskPriority(e.target.value as Priority)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-700 dark:text-zinc-300 text-xs font-bold outline-none cursor-pointer border-none"
                >
                  <option value="high">بالا</option>
                  <option value="medium">متوسط</option>
                  <option value="low">پایین</option>
                </select>

                {/* Assignee Selector */}
                <select
                  value={quickTaskAssignee}
                  onChange={(e) => setQuickTaskAssignee(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-700 dark:text-zinc-300 text-xs font-bold outline-none cursor-pointer border-none max-w-[130px] truncate"
                >
                  {selectedProject.memberIds?.map((mId) => {
                    const u = users.find((user) => user.id === mId) || friends.find((f) => f.id === mId);
                    const label = u?.name || (mId === currentUser?.id ? 'خودم' : 'عضو');
                    return (
                      <option key={mId} value={mId}>
                        {label}
                      </option>
                    );
                  })}
                </select>

                <button
                  type="submit"
                  disabled={!quickTaskTitle.trim() || isQuickAdding}
                  className="px-4 py-1.5 rounded-xl bg-[#007aff] hover:bg-[#0071e3] disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer flex-shrink-0 active:scale-95"
                >
                  {isQuickAdding ? 'در حال ثبت...' : 'افزودن'}
                </button>
              </div>
            </form>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-[#1c1c1e] rounded-[22px] border border-black/[0.06] dark:border-white/[0.08]">
              {/* Status Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    sounds.playPop();
                    setTaskStatusFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    taskStatusFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#2c2c2e]'
                  }`}
                >
                  همه ({toPersianDigits(projectTasks.length)})
                </button>
                <button
                  onClick={() => {
                    sounds.playPop();
                    setTaskStatusFilter('pending');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    taskStatusFilter === 'pending'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#2c2c2e]'
                  }`}
                >
                  در حال انجام ({toPersianDigits(pendingTasks.length)})
                </button>
                <button
                  onClick={() => {
                    sounds.playPop();
                    setTaskStatusFilter('completed');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    taskStatusFilter === 'completed'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#2c2c2e]'
                  }`}
                >
                  تکمیل‌شده ({toPersianDigits(completedTasks.length)})
                </button>
              </div>

              {/* Assignee & Priority Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={taskAssigneeFilter}
                  onChange={(e) => setTaskAssigneeFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-700 dark:text-zinc-300 text-xs font-bold outline-none cursor-pointer border-none"
                >
                  <option value="all">فیلتر مسئول: همه اعضا</option>
                  {selectedProject.memberIds?.map((mId) => {
                    const u = users.find((user) => user.id === mId) || friends.find((f) => f.id === mId);
                    return (
                      <option key={mId} value={mId}>
                        {u?.name || mId}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={taskPriorityFilter}
                  onChange={(e) => setTaskPriorityFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-700 dark:text-zinc-300 text-xs font-bold outline-none cursor-pointer border-none"
                >
                  <option value="all">اولویت: همه</option>
                  <option value="urgent">فوری</option>
                  <option value="high">بالا</option>
                  <option value="medium">متوسط</option>
                  <option value="low">پایین</option>
                </select>
              </div>
            </div>

            {/* Tasks List Content */}
            {displayedTasks.length === 0 ? (
              <div className="py-16 text-center p-8 bg-white dark:bg-[#1c1c1e] rounded-[26px] border border-dashed border-black/[0.08] dark:border-white/[0.1] space-y-3">
                <CheckSquare className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                  هیچ تسکی با فیلترهای انتخابی یافت نشد.
                </p>
                <button
                  onClick={() => openCreateModal(undefined, undefined, selectedProject.id)}
                  className="px-4 py-2 rounded-xl bg-[#007aff] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ثبت اولین تسک در این پروژه</span>
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

        {/* =========================================
            TAB 2: KANBAN BOARD VIEW
        ========================================= */}
        {activeProjectTab === 'kanban' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {/* Column 1: To Do */}
              <div className="p-4 bg-[#f2f2f7]/80 dark:bg-[#1c1c1e] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] space-y-3 min-h-[300px]">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                      در انتظار شروع
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#2c2c2e] text-slate-600 dark:text-zinc-400 shadow-2xs">
                    {toPersianDigits(kanbanColumns.todo.length)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {kanbanColumns.todo.map((task) => {
                    const assignee = users.find((u) => u.id === task.userId) || friends.find((f) => f.id === task.userId);
                    return (
                      <div
                        key={task.id}
                        className="p-3 bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs space-y-2.5 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                            {task.title}
                          </h4>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0 ${
                              task.priority === 'high'
                                ? 'bg-red-500/10 text-red-500'
                                : task.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-blue-500/10 text-blue-500'
                            }`}
                          >
                            {task.priority === 'high' ? 'بالا' : task.priority === 'medium' ? 'متوسط' : 'عادی'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-black/[0.03] dark:border-white/[0.04] text-[10px] text-slate-400">
                          <span>{assignee?.name || 'بدون مسئول'}</span>
                          <button
                            onClick={() => handleMoveKanban(task, 'in_progress')}
                            className="text-[#007aff] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>شروع</span>
                            <ArrowRight className="w-3 h-3 rotate-180" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {kanbanColumns.todo.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-[11px] font-bold">
                      کاری در این ستون نیست
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="p-4 bg-[#f2f2f7]/80 dark:bg-[#1c1c1e] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] space-y-3 min-h-[300px]">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#007aff] animate-pulse" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                      در حال انجام
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#2c2c2e] text-[#007aff] shadow-2xs">
                    {toPersianDigits(kanbanColumns.in_progress.length)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {kanbanColumns.in_progress.map((task) => {
                    const assignee = users.find((u) => u.id === task.userId) || friends.find((f) => f.id === task.userId);
                    return (
                      <div
                        key={task.id}
                        className="p-3 bg-white dark:bg-[#2c2c2e] rounded-2xl border border-blue-500/20 shadow-xs space-y-2.5 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                            {task.title}
                          </h4>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-blue-500/10 text-[#007aff]">
                            جاری
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-black/[0.03] dark:border-white/[0.04] text-[10px] text-slate-400">
                          <button
                            onClick={() => handleMoveKanban(task, 'todo')}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            ← عقب
                          </button>
                          <span>{assignee?.name || 'تیم'}</span>
                          <button
                            onClick={() => handleMoveKanban(task, 'review')}
                            className="text-amber-500 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>بررسی</span>
                            <ArrowRight className="w-3 h-3 rotate-180" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {kanbanColumns.in_progress.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-[11px] font-bold">
                      کاری در جریان نیست
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Review / QA */}
              <div className="p-4 bg-[#f2f2f7]/80 dark:bg-[#1c1c1e] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] space-y-3 min-h-[300px]">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                      در حال بررسی (Review)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#2c2c2e] text-amber-500 shadow-2xs">
                    {toPersianDigits(kanbanColumns.review.length)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {kanbanColumns.review.map((task) => {
                    const assignee = users.find((u) => u.id === task.userId) || friends.find((f) => f.id === task.userId);
                    return (
                      <div
                        key={task.id}
                        className="p-3 bg-white dark:bg-[#2c2c2e] rounded-2xl border border-amber-500/20 shadow-xs space-y-2.5 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                            {task.title}
                          </h4>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-amber-500/10 text-amber-500">
                            بازبینی
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-black/[0.03] dark:border-white/[0.04] text-[10px] text-slate-400">
                          <button
                            onClick={() => handleMoveKanban(task, 'in_progress')}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            ← برگشت
                          </button>
                          <span>{assignee?.name || 'تیم'}</span>
                          <button
                            onClick={() => handleMoveKanban(task, 'done')}
                            className="text-emerald-500 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>تایید نهایی</span>
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {kanbanColumns.review.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-[11px] font-bold">
                      کاری در انتظار تایید نیست
                    </div>
                  )}
                </div>
              </div>

              {/* Column 4: Done */}
              <div className="p-4 bg-[#f2f2f7]/80 dark:bg-[#1c1c1e] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] space-y-3 min-h-[300px]">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#34c759]" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                      تکمیل‌شده
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#2c2c2e] text-[#34c759] shadow-2xs">
                    {toPersianDigits(kanbanColumns.done.length)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {kanbanColumns.done.map((task) => {
                    return (
                      <div
                        key={task.id}
                        className="p-3 bg-white/70 dark:bg-[#2c2c2e]/70 rounded-2xl border border-emerald-500/20 shadow-xs space-y-2 opacity-85 hover:opacity-100 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#34c759] flex-shrink-0" />
                          <h4 className="text-xs font-bold line-through text-slate-500 dark:text-zinc-400 truncate">
                            {task.title}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                          <span>انجام شد ✓</span>
                          <button
                            onClick={() => handleMoveKanban(task, 'todo')}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            بازگشایی ↩
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {kanbanColumns.done.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-[11px] font-bold">
                      هنوز کاری تمام نشده
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            TAB 3: MILESTONES & PHASES
        ========================================= */}
        {activeProjectTab === 'milestones' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1c1c1e] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span>فازبندی و مایلستون‌های پروژه (Roadmap)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  اهداف بزرگ را به فازهای اجرایی با تاریخ سررسید شفاف خرد کنید.
                </p>
              </div>

              <button
                onClick={() => {
                  sounds.playPop();
                  setShowAddMilestone(!showAddMilestone);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#007aff] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>مایلستون جدید</span>
              </button>
            </div>

            {/* Add Milestone Form */}
            {showAddMilestone && (
              <form
                onSubmit={handleAddMilestone}
                className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[24px] border border-blue-500/20 shadow-md space-y-3 animate-in slide-in-from-top-2"
              >
                <h4 className="text-xs font-black text-slate-800 dark:text-white">
                  تعریف فاز یا مایلستون جدید:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    placeholder="عنوان مایلستون (مثلاً فاز ۱: انتشار نسخه آزمایشی)"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-xs font-bold text-slate-800 dark:text-white outline-none border border-transparent focus:border-[#007aff]"
                  />
                  <input
                    type="text"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    placeholder="تاریخ یا بازه تحویل (مثلاً پایان آبان ۱۴۰۵)"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-xs font-bold text-slate-800 dark:text-white outline-none border border-transparent focus:border-[#007aff]"
                  />
                </div>
                <textarea
                  rows={2}
                  value={newMilestoneNotes}
                  onChange={(e) => setNewMilestoneNotes(e.target.value)}
                  placeholder="توضیحات خروجی مورد انتظار این فاز..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-xs font-medium text-slate-800 dark:text-white outline-none border border-transparent focus:border-[#007aff] resize-none"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddMilestone(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-xs font-bold text-slate-600 dark:text-zinc-300"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#007aff] text-white text-xs font-bold shadow-sm"
                  >
                    ذخیره فاز
                  </button>
                </div>
              </form>
            )}

            {/* Milestones List */}
            {milestones.length === 0 ? (
              <div className="py-14 text-center p-6 bg-white dark:bg-[#1c1c1e] rounded-[26px] border border-dashed border-black/[0.08] dark:border-white/[0.1] space-y-2">
                <Target className="w-8 h-8 text-amber-500/40 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                  هنوز مایلستونی برای این پروژه تعریف نشده است.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-4 bg-white dark:bg-[#1c1c1e] rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex items-center justify-between gap-4 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleMilestone(m.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                          m.completed
                            ? 'bg-[#34c759] border-[#34c759] text-white'
                            : 'border-slate-300 dark:border-zinc-600 hover:border-[#34c759]'
                        }`}
                      >
                        {m.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#f2f2f7] dark:bg-[#2c2c2e] font-bold text-slate-500 dark:text-zinc-400">
                            فاز {toPersianDigits(idx + 1)}
                          </span>
                          <h4
                            className={`text-xs sm:text-sm font-black ${
                              m.completed
                                ? 'line-through text-slate-400 dark:text-zinc-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {m.title}
                          </h4>
                        </div>
                        {m.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                            {m.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.dueDate && (
                        <span className="text-[10px] px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{m.dueDate}</span>
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="حذف مایلستون"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================
            TAB 4: MEMBERS & WORKLOAD DIRECTORY
        ========================================= */}
        {activeProjectTab === 'members' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1c1c1e] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#007aff]" />
                  <span>اعضای پروژه و تقسیم بار کاری</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  مشاهده نقش‌ها، عملکرد و تعداد تسک‌های محول‌شده به هر عضو تیم.
                </p>
              </div>

              <button
                onClick={() => {
                  sounds.playPop();
                  openEditDialog(selectedProject);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#007aff] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>دعوت عضو جدید</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {selectedProject.memberIds?.map((mId) => {
                const memberUser = users.find((u) => u.id === mId) || friends.find((f) => f.id === mId);
                const isCreator = mId === selectedProject.creatorId;
                const memberTasks = projectTasks.filter((t) => t.userId === mId);
                const doneCount = memberTasks.filter((t) => t.completed).length;
                const memberProgress = memberTasks.length > 0 ? Math.round((doneCount / memberTasks.length) * 100) : 0;

                return (
                  <div
                    key={mId}
                    className="p-4 bg-white dark:bg-[#1c1c1e] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs space-y-3.5 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar user={memberUser} size="sm" />
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {memberUser?.name || 'عضو تیم'}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-mono">
                            @{memberUser?.username || mId}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          isCreator
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-600 dark:text-zinc-300'
                        }`}
                      >
                        {isCreator ? 'مالک پروژه' : 'عضو تیم'}
                      </span>
                    </div>

                    {/* Member Stats */}
                    <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                      <div className="p-2 rounded-xl bg-[#f9f9fb] dark:bg-[#2c2c2e]/40">
                        <span className="text-slate-400 font-bold block">تسک‌های محول</span>
                        <span className="font-black text-slate-800 dark:text-white text-xs mt-0.5">
                          {toPersianDigits(memberTasks.length)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#f9f9fb] dark:bg-[#2c2c2e]/40">
                        <span className="text-slate-400 font-bold block">تکمیل‌شده</span>
                        <span className="font-black text-[#34c759] text-xs mt-0.5">
                          {toPersianDigits(doneCount)}
                        </span>
                      </div>
                    </div>

                    {/* Mini Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>بازدهی در پروژه:</span>
                        <span className="font-mono">{toPersianDigits(memberProgress)}٪</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#007aff]"
                          style={{ width: `${memberProgress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        sounds.playPop();
                        setTaskAssigneeFilter(mId);
                        setActiveProjectTab('tasks');
                      }}
                      className="w-full py-1.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Filter className="w-3 h-3" />
                      <span>مشاهده کارهای این عضو</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================
            TAB 5: LIVE TEAM CHAT ROOM
        ========================================= */}
        {activeProjectTab === 'chat' && (
          <div className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                  اتاق گفتگوی زنده تیم «{selectedProject.name}»
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                همگام‌سازی ابری
              </span>
            </div>

            {/* Chat Messages Log */}
            <div className="space-y-3 max-h-[420px] min-h-[220px] overflow-y-auto p-3 rounded-2xl bg-[#f9f9fb] dark:bg-[#121214] border border-black/[0.03] dark:border-white/[0.05]">
              {projectMessages.length === 0 ? (
                <div className="py-14 text-center text-slate-400 text-xs font-bold space-y-1">
                  <p>هنوز پیامی در این پروژه ارسال نشده است.</p>
                  <p className="text-[11px] font-normal text-slate-400">
                    با ارسال اولین پیام، گفتگو با اعضای تیم را آغاز کنید!
                  </p>
                </div>
              ) : (
                projectMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-start' : 'items-end'} space-y-1`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1 font-bold">
                        <span>{msg.senderName}</span>
                        <span>•</span>
                        <span dir="ltr">
                          {new Date(msg.createdAt).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl text-xs font-medium max-w-[85%] leading-relaxed ${
                          isMe
                            ? 'bg-[#007aff] text-white rounded-tr-xs shadow-sm'
                            : 'bg-white dark:bg-[#2c2c2e] text-slate-800 dark:text-white rounded-tl-xs border border-black/[0.05] dark:border-white/[0.06] shadow-2xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Send Input Form */}
            <form onSubmit={handleSendChatMessage} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="پیام خود را برای اعضای این پروژه بنویسید..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-xs font-bold text-slate-800 dark:text-white outline-none border border-transparent focus:border-[#007aff]"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSendingMessage}
                className="px-5 py-2.5 rounded-2xl bg-[#007aff] hover:bg-[#0071e3] disabled:opacity-40 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5 rotate-180" />
                <span>ارسال</span>
              </button>
            </form>
          </div>
        )}

        {/* =========================================
            TAB 6: DOCS, LINKS & RESOURCES
        ========================================= */}
        {activeProjectTab === 'resources' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1c1c1e] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-sky-500" />
                  <span>اسناد، لینک‌ها و منابع متصل به پروژه</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  اشتراک‌گذاری لینک مخزن کد، فایل‌های فیگما، درایو، و داکیومنت‌ها.
                </p>
              </div>

              <button
                onClick={() => {
                  sounds.playPop();
                  setShowAddResource(!showAddResource);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#007aff] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ثبت لینک جدید</span>
              </button>
            </div>

            {/* Add Resource Form */}
            {showAddResource && (
              <form
                onSubmit={handleAddResource}
                className="p-5 bg-white dark:bg-[#1c1c1e] rounded-[24px] border border-sky-500/20 shadow-md space-y-3 animate-in slide-in-from-top-2"
              >
                <h4 className="text-xs font-black text-slate-800 dark:text-white">
                  افزودن منبع یا پیوند جدید به پروژه:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={newResourceTitle}
                    onChange={(e) => setNewResourceTitle(e.target.value)}
                    placeholder="عنوان لینک (مثلاً: پروتوتایپ فیگما)"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-xs font-bold text-slate-800 dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                    placeholder="آدرس اینترنتی (URL)"
                    dir="ltr"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-xs font-bold text-slate-800 dark:text-white outline-none"
                  />
                  <select
                    value={newResourceCategory}
                    onChange={(e) => setNewResourceCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-xs font-bold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="figma">طراحی فیگما (Figma)</option>
                    <option value="github">مخزن سورس‌کد (GitHub)</option>
                    <option value="drive">پوشه ابری (Google Drive)</option>
                    <option value="doc">داکیومنت و متن (Doc)</option>
                    <option value="other">سایر پیوندها</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddResource(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-xs font-bold text-slate-600 dark:text-zinc-300"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#007aff] text-white text-xs font-bold shadow-sm"
                  >
                    ثبت منبع
                  </button>
                </div>
              </form>
            )}

            {/* Resources List */}
            {resources.length === 0 ? (
              <div className="py-14 text-center p-6 bg-white dark:bg-[#1c1c1e] rounded-[26px] border border-dashed border-black/[0.08] dark:border-white/[0.1] space-y-2">
                <Link2 className="w-8 h-8 text-sky-500/40 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                  هنوز منبع یا لینکی برای این پروژه پیوست نشده است.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {resources.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 bg-white dark:bg-[#1c1c1e] rounded-[22px] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex items-center justify-between gap-3 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {res.title}
                        </h4>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-sky-500 hover:underline truncate block"
                          dir="ltr"
                        >
                          {res.url}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-600 dark:text-zinc-300 hover:text-[#007aff] cursor-pointer"
                        title="باز کردن لینک"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteResource(res.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 cursor-pointer"
                        title="حذف پیوند"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN DIRECTORY OF ALL TEAM PROJECTS
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in pb-20 select-none" dir="rtl">
      {/* 1. APPLE BENTO PRO HERO HEADER */}
      <div className="p-6 sm:p-7 bg-white dark:bg-[#1c1c1e] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#007aff] text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              <FolderKanban className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  مرکز فرماندهی پروژه‌های تیمی
                </h2>
                {!isPro && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">
                    پلن رایگان (حداکثر ۱ پروژه)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                فضای کار اشتراکی، بردهای کانبان، تخصیص هوشمند وظایف و چت زنده اعضای تیم
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playPop();
              openCreateDialog();
            }}
            className="px-5 py-2.5 rounded-2xl bg-[#007aff] hover:bg-[#0071e3] text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>ایجاد پروژه تیمی جدید</span>
          </button>
        </div>

        {/* 4 Apple Activity Metric Gauges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">پروژه‌های در دست</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                {toPersianDigits(myVisibleProjects.length)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#007aff]/10 text-[#007aff] flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">وظایف تیمی جاری</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                {toPersianDigits(overallStats.totalProjectTasks)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#ff9500]/10 text-[#ff9500] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">میانگین پیشرفت کل</div>
              <div className="text-xl font-black text-[#34c759] mt-0.5 font-mono">
                {toPersianDigits(overallStats.avgProgress)}٪
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#34c759]/10 text-[#34c759] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-[#f2f2f7] dark:bg-[#2c2c2e]/60 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">همکاران متصل</div>
              <div className="text-xl font-black text-[#5856d6] mt-0.5 font-mono">
                {toPersianDigits(overallStats.totalMembersCount)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#5856d6]/10 text-[#5856d6] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOOLBAR: SEARCH & STATUS FILTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white dark:bg-[#1c1c1e] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={projectSearchQuery}
            onChange={(e) => setProjectSearchQuery(e.target.value)}
            placeholder="جستجوی عنوان یا شرح پروژه..."
            className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-white outline-none placeholder:text-slate-400"
          />
          {projectSearchQuery && (
            <button onClick={() => setProjectSearchQuery('')} className="text-slate-400 hover:text-black">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => {
              sounds.playPop();
              setProjectStatusFilter('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              projectStatusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-600 dark:text-zinc-400 hover:text-black'
            }`}
          >
            همه ({toPersianDigits(myVisibleProjects.length)})
          </button>
          <button
            onClick={() => {
              sounds.playPop();
              setProjectStatusFilter('mine');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              projectStatusFilter === 'mine'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-600 dark:text-zinc-400 hover:text-black'
            }`}
          >
            پروژه‌های من
          </button>
          <button
            onClick={() => {
              sounds.playPop();
              setProjectStatusFilter('shared');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              projectStatusFilter === 'shared'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-600 dark:text-zinc-400 hover:text-black'
            }`}
          >
            پروژه‌های مشترک
          </button>
          <button
            onClick={() => {
              sounds.playPop();
              setProjectStatusFilter('active');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              projectStatusFilter === 'active'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-600 dark:text-zinc-400 hover:text-black'
            }`}
          >
            در حال انجام
          </button>
          <button
            onClick={() => {
              sounds.playPop();
              setProjectStatusFilter('completed');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              projectStatusFilter === 'completed'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-600 dark:text-zinc-400 hover:text-black'
            }`}
          >
            تکمیل‌شده
          </button>
        </div>
      </div>

      {/* 3. PROJECTS GRID */}
      {filteredProjects.length === 0 ? (
        <div className="py-20 text-center p-8 bg-white dark:bg-[#1c1c1e] rounded-[30px] border border-dashed border-black/[0.08] dark:border-white/[0.1] space-y-4">
          <FolderKanban className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">
            پروژه‌ای برای نمایش یافت نشد
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            با ایجاد اولین پروژه تیمی یا دریافت دعوت از همکاران، فضاهای کاری مشترک در اینجا قرار می‌گیرند.
          </p>
          <button
            onClick={() => {
              sounds.playPop();
              openCreateDialog();
            }}
            className="px-5 py-2.5 rounded-2xl bg-[#007aff] hover:bg-[#0071e3] text-white font-black text-xs cursor-pointer shadow-md shadow-blue-500/20 inline-flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد اولین پروژه تیمی</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const projectTasks = tasks.filter((t) => t.projectId === proj.id);
            const total = projectTasks.length;
            const done = projectTasks.filter((t) => t.completed).length;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;
            const canManage = currentUser?.role === 'admin' || proj.creatorId === currentUser?.id;

            return (
              <div
                key={proj.id}
                onClick={() => {
                  sounds.playPop();
                  setSelectedProject(proj);
                  setActiveProjectTab('tasks');
                }}
                className="p-5 bg-white dark:bg-[#1c1c1e] hover:bg-[#fafafc] dark:hover:bg-[#252528] rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden cursor-pointer"
              >
                <div
                  className="absolute top-0 right-0 left-0 h-1.5"
                  style={{ backgroundColor: proj.color || '#007aff' }}
                />

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: proj.color || '#007aff' }}
                      >
                        {renderIcon(proj.icon, 'w-5 h-5')}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {proj.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          توسط <span className="text-slate-700 dark:text-zinc-300 font-bold">{proj.creatorName}</span>
                        </p>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playPop();
                            openEditDialog(proj);
                          }}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                          title="ویرایش پروژه"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`آیا از حذف پروژه تیمی «${proj.name}» اطمینان دارید؟`)) {
                              sounds.playTrash();
                              try {
                                await deleteTeamProject(proj.id);
                              } catch (err: any) {
                                alert(err.message || 'خطا در حذف پروژه');
                              }
                            }
                          }}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
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

                {/* Progress bar */}
                <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">
                      {toPersianDigits(done)} از {toPersianDigits(total)} کار تکمیل شد
                    </span>
                    <span className="font-mono font-black text-slate-700 dark:text-zinc-300">
                      {toPersianDigits(percent)}٪
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: proj.color || '#007aff',
                      }}
                    />
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center -space-x-1.5 space-x-reverse">
                    {proj.memberIds?.slice(0, 4).map((mId) => {
                      const u = users.find((user) => user.id === mId) || friends.find((f) => f.id === mId);
                      const memberName = u?.name || 'عضو';
                      return (
                        <div
                          key={mId}
                          title={memberName}
                          className="w-6 h-6 rounded-full bg-slate-900 border-2 border-white dark:border-[#1c1c1e] text-white font-bold text-[10px] flex items-center justify-center shadow-xs"
                        >
                          {memberName.slice(0, 1)}
                        </div>
                      );
                    })}
                    {proj.memberIds && proj.memberIds.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 border-2 border-white dark:border-[#1c1c1e] text-slate-600 dark:text-zinc-300 text-[9px] font-black flex items-center justify-center">
                        +{toPersianDigits(proj.memberIds.length - 4)}
                      </div>
                    )}
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] group-hover:bg-[#007aff] group-hover:text-white text-slate-800 dark:text-zinc-200 font-bold text-xs transition-all flex items-center gap-1">
                    <span>ورود به محیط پروژه</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. CREATE / EDIT PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1e] rounded-[32px] p-6 shadow-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#007aff]" />
                {editingProject ? 'ویرایش پروژه تیمی' : 'ایجاد پروژه تیمی جدید'}
              </h3>
              <button
                onClick={() => {
                  sounds.playPop();
                  setIsModalOpen(false);
                  setEditingProject(null);
                }}
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
                  placeholder="مثال: توسعه وب‌سایت، کمپین فروش یا مدیریت محتوا"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-800 dark:text-white text-xs outline-none focus:border-[#007aff] font-bold border border-transparent"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-zinc-300">توضیحات و اهداف پروژه</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="شرح مختصری از اهداف، مایلستون‌ها یا دستورالعمل‌ها..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-800 dark:text-white text-xs outline-none focus:border-[#007aff] resize-none font-medium border border-transparent"
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
                <label className="font-bold text-slate-700 dark:text-zinc-300">نماد و آیکون</label>
                <div className="grid grid-cols-6 gap-2">
                  {PROJECT_ICONS.map((i) => {
                    const Comp = i.icon;
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => setIcon(i.id)}
                        className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                          icon === i.id
                            ? 'bg-[#007aff] text-white shadow-sm'
                            : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        <Comp className="w-4 h-4" />
                        <span className="text-[9px] font-bold">{i.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Member Selection */}
              <div className="space-y-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    اعضای همکار در پروژه ({toPersianDigits(selectedMembers.length)} نفر انتخاب شده)
                  </label>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="جستجوی همکار با نام یا نام‌کاربری..."
                    className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-800 dark:text-white text-xs outline-none"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {filteredFriends.map((f) => {
                    const isSelected = selectedMembers.includes(f.id);
                    const isMe = currentUser && f.id === currentUser.id;

                    return (
                      <div
                        key={f.id}
                        onClick={() => toggleMember(f.id)}
                        className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900'
                            : 'hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <UserAvatar user={f} size="xs" />
                          <span className="font-bold text-slate-800 dark:text-zinc-200">
                            {f.name} {isMe ? '(شما)' : ''}
                          </span>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-[#007aff]" />}
                      </div>
                    );
                  })}

                  {/* Non-friends search results */}
                  {nonFriendResults.length > 0 && (
                    <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        سایر همکاران در سیستم (برای ارسال دعوت‌نامه):
                      </span>
                      {nonFriendResults.map((u) => {
                        const isInvited = invitedUserIds.has(u.id);
                        return (
                          <div
                            key={u.id}
                            className="p-2 rounded-xl flex items-center justify-between hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <UserAvatar user={u} size="xs" />
                              <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
                                {u.name} (@{u.username})
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSendProjectInvite(u)}
                              disabled={isInvited}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isInvited
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-[#007aff] text-white hover:bg-[#0071e3]'
                              }`}
                            >
                              {isInvited ? 'دعوت ارسال شد ✓' : 'ارسال دعوت'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-slate-700 dark:text-zinc-300 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-5 py-2 rounded-xl bg-[#007aff] hover:bg-[#0071e3] disabled:opacity-40 text-white font-black shadow-md shadow-blue-500/20 active:scale-95"
                >
                  {isSubmitting ? 'در حال ذخیره...' : editingProject ? 'بروزرسانی پروژه' : 'ایجاد پروژه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
