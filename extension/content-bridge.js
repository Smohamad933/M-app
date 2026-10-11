/**
 * Bag Time Browser Extension - SSO Content Bridge
 * Automatically synchronizes authentication session between Bag Time Web Planner and Extension
 */
(function () {
  'use strict';

  // Check if current page is Bag Time
  function isBagTimePage() {
    return (
      document.title.includes('بگ تایم') ||
      document.title.includes('Bag Time') ||
      document.title.includes('TaskRooz') ||
      Boolean(localStorage.getItem('taskrooz_token')) ||
      Boolean(localStorage.getItem('bagtime_token')) ||
      window.location.hostname.includes('bagtime.negahm.ir') ||
      window.location.hostname.includes('mohusyn.ir') ||
      window.location.hostname.includes('negahm.ir') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1') ||
      window.location.hostname.includes('e2b.app')
    );
  }

  function syncLocalSessionToExtension() {
    if (!isBagTimePage()) return;

    try {
      const token = localStorage.getItem('taskrooz_auth_token') || localStorage.getItem('taskrooz_token') || localStorage.getItem('bagtime_token');
      const userStr = localStorage.getItem('taskrooz_current_user') || localStorage.getItem('taskrooz_user') || localStorage.getItem('bagtime_user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        const serverUrl = window.location.origin;

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['account'], (res) => {
            const existing = res.account;
            if (!existing || existing.token !== token || existing.user?.id !== user.id) {
              const accountData = {
                user,
                token,
                serverUrl,
                syncedVia: 'SSO_AUTO_BRIDGE',
                syncedAt: new Date().toISOString(),
              };
              chrome.storage.local.set({
                account: accountData,
                active_server: serverUrl,
              }, () => {
                window.postMessage({
                  type: 'BAGTIME_SSO_SYNC_SUCCESS',
                  serverUrl,
                  userId: user.id,
                }, '*');
              });
            }
          });
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Initial sync attempt after page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncLocalSessionToExtension);
  } else {
    syncLocalSessionToExtension();
  }

  // Periodic safety check in case user logs in via SPA client route
  setInterval(syncLocalSessionToExtension, 3000);

  // Listen for explicit web app postMessages
  window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'BAGTIME_PING_EXT') {
      window.postMessage({
        type: 'BAGTIME_EXT_PONG',
        installed: true,
        version: '1.0.1',
        features: ['sso', 'quick_tasks', 'time_blocking'],
      }, '*');
    }

    if (event.data.type === 'BAGTIME_SSO_LOGIN') {
      const { token, user, server } = event.data;
      if (token && user && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const serverUrl = server || window.location.origin;
        const accountData = {
          user,
          token,
          serverUrl,
          syncedVia: 'SSO_MESSAGE_EVENT',
          syncedAt: new Date().toISOString(),
        };
        chrome.storage.local.set({
          account: accountData,
          active_server: serverUrl,
        }, () => {
          window.postMessage({ type: 'BAGTIME_SSO_SYNC_SUCCESS', serverUrl, userId: user.id }, '*');
        });
      }
    }

    if (event.data.type === 'BAGTIME_SSO_LOGOUT') {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(['account']);
      }
    }
  });

  // Announce presence to web app
  window.postMessage({
    type: 'BAGTIME_EXT_PONG',
    installed: true,
    version: '1.0.1',
    features: ['sso', 'quick_tasks', 'time_blocking'],
  }, '*');
})();
