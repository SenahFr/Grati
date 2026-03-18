import { supabase } from './lib/supabase.js';

window.addEventListener('DOMContentLoaded', async () => {
  const loginEl = document.getElementById('admin-login');
  const panelEl = document.getElementById('admin-panel');
  const errorEl = document.getElementById('login-error');
  const todayDateEl = document.getElementById('today-date');

  // Only activate admin logic if URL ends with /admin
  if (!window.location.pathname.endsWith('/admin')) return;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const { data: userData } = await supabase.auth.getUser();

    const isAdmin =
      !!sessionData.session &&
      userData.user?.email === 'smisnerdesign@gmail.com';

    if (isAdmin) {
      panelEl.classList.remove('hidden');
      loginEl.classList.add('hidden');
      todayDateEl.textContent = new Date().toDateString();
    } else {
      loginEl.classList.remove('hidden');
    }

    // Optional: listen to auth state changes
    supabase.auth.onAuthStateChange(() => location.reload());
  } catch (err) {
    console.error('Admin auth error:', err);
    loginEl.classList.remove('hidden');
  }
});