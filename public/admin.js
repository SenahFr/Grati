window.addEventListener('DOMContentLoaded', async () => {
  const adminPaths = new Set(['/admin', '/admin/']);

  if (!adminPaths.has(window.location.pathname)) {
    return;
  }

  const loginEl = document.getElementById('admin-login');
  const panelEl = document.getElementById('admin-panel');
  const errorEl = document.getElementById('login-error');
  const todayDateEl = document.getElementById('today-date');

  if (!loginEl || !panelEl || !errorEl || !todayDateEl) {
    return;
  }

  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('error') === '1') {
    errorEl.classList.remove('hidden');
  }

  try {
    const response = await fetch('/admin/status', {
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Admin status request failed with ${response.status}`);
    }

    const status = await response.json();
    const authenticated = Boolean(status?.authenticated);

    if (authenticated) {
      panelEl.classList.remove('hidden');
      loginEl.classList.add('hidden');
      todayDateEl.textContent = new Date().toDateString();
      return;
    }

    loginEl.classList.remove('hidden');
    panelEl.classList.add('hidden');
  } catch (error) {
    console.error('Admin auth error:', error);
    loginEl.classList.remove('hidden');
    panelEl.classList.add('hidden');
  }
});