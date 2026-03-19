import { supabase } from './lib/supabase.js';

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
    const { data: sessionData } = await supabase.auth.getSession();
    const { data: userData } = await supabase.auth.getUser();

    const authenticated =
      !!sessionData.session &&
      userData.user?.email === 'smisnerdesign@gmail.com';

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