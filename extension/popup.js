// Compact toolbar popup script
const Storage = {
  async get(key, defaultValue = null) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (res) => {
          resolve(res[key] !== undefined ? res[key] : defaultValue);
        });
      });
    }
    try {
      const v = localStorage.getItem('bagtime_ext_' + key);
      return v !== null ? JSON.parse(v) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  async set(key, value) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
      });
    }
    try {
      localStorage.setItem('bagtime_ext_' + key, JSON.stringify(value));
    } catch {}
  }
};

async function loadPopup() {
  const tasks = (await Storage.get('tasks', [])) || [];
  const listEl = document.getElementById('popupTasks');
  
  if (tasks.length === 0) {
    listEl.innerHTML = '<div style="text-align:center;color:#94a3b8;font-size:11px;padding:8px;">تسکی برای امروز ثبت نشده</div>';
  } else {
    listEl.innerHTML = tasks.slice(0, 5).map(t => `
      <div class="task-item ${t.completed ? 'done' : ''}">
        <span>${t.completed ? '✓' : '○'}</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.title}</span>
      </div>
    `).join('');
  }

  document.getElementById('popupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('popupInput');
    const title = input.value.trim();
    if (!title) return;
    const newTask = {
      id: 'task_' + Date.now(),
      title,
      priority: 'medium',
      completed: false
    };
    tasks.unshift(newTask);
    await Storage.set('tasks', tasks);
    input.value = '';
    loadPopup();

    // Push to server if account is connected
    const account = await Storage.get('auth_account', null);
    if (account && account.token) {
      const baseUrl = (account.serverUrl || 'https://task.mohusyn.ir').replace(/\/+$/, '');
      fetch(`${baseUrl}/api/tasks.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${account.token}`,
        },
        body: JSON.stringify({
          title: newTask.title,
          priority: 'medium',
          date: new Date().toISOString().split('T')[0],
        }),
      }).catch(() => {});
    }
  });

  document.getElementById('openNewTab').addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('newtab.html') });
    } else {
      window.open('newtab.html', '_blank');
    }
  });
}

document.addEventListener('DOMContentLoaded', loadPopup);
