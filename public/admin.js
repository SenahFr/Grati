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
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const { authenticated } = await response.json();

    if (authenticated) {
      panelEl.classList.remove('hidden');
      loginEl.classList.add('hidden');
      todayDateEl.textContent = new Date().toDateString();
      return;
    }

    loginEl.classList.remove('hidden');
    panelEl.classList.add('hidden');
  } catch (error) {
    console.error('Admin status error:', error);
    loginEl.classList.remove('hidden');
    panelEl.classList.add('hidden');
  }
});