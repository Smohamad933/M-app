import type { Task, User, Category } from '../types';

const TOKEN_KEY = 'taskrooz_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'خطایی رخ داد.');
  }

  return data;
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string; message: string }>('/api/auth?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(data.token);
    return data;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await request<{ authenticated: boolean; user?: User }>('/api/auth?action=me');
      return data.authenticated && data.user ? data.user : null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth?action=logout', { method: 'POST' });
    } catch {
      // ignore
    }
    removeAuthToken();
  },

  // Users (Admin only)
  async getUsers(): Promise<User[]> {
    const data = await request<{ users: User[] }>('/api/users');
    return data.users;
  },

  async createUser(user: { username: string; password: string; name: string; role: 'admin' | 'user' }): Promise<User> {
    const data = await request<{ user: User; message: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    return data.user;
  },

  async updateUser(user: { id: string; name: string; role: 'admin' | 'user'; password?: string }): Promise<void> {
    await request('/api/users', {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },

  async deleteUser(id: string): Promise<void> {
    await request(`/api/users?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Tasks
  async getTasks(filter?: { userId?: string | null; date?: string; categoryId?: string }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('user_id', filter.userId);
    if (filter?.date) params.append('date', filter.date);
    if (filter?.categoryId) params.append('category_id', filter.categoryId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const data = await request<{ tasks: Task[] }>(`/api/tasks${queryString}`);
    return data.tasks;
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const data = await request<{ task: Task; message: string }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
    return data.task;
  },

  async updateTask(task: Task): Promise<void> {
    await request('/api/tasks', {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  },

  async deleteTask(id: string): Promise<void> {
    await request(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async toggleTask(id: string): Promise<{ completed: boolean; completedAt?: string }> {
    return await request(`/api/tasks?action=toggle&id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
    });
  },

  async addFocusMinutes(id: string, minutes: number): Promise<void> {
    await request(`/api/tasks?action=addFocus&id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ minutes }),
    });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const data = await request<{ categories: Category[] }>('/api/categories');
    return data.categories;
  },

  async createCategory(cat: { name: string; color: string; icon: string }): Promise<Category> {
    const data = await request<{ category: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    });
    return data.category;
  },

  // Stats
  async getStats(userId?: string | null): Promise<any> {
    const url = userId ? `/api/stats?user_id=${encodeURIComponent(userId)}` : '/api/stats';
    return await request(url);
  },
};
