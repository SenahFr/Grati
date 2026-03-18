import { supabase } from '/src/lib/supabase.js';

async function bootstrapAdmin() {
  const loginEl = document.getElementById('admin-login');
  const panelEl = document.getElementById('admin-panel');
  const errorEl = document.getElementById('login-error');
  const todayDateEl = document.getElementById('today-date');

  const { data: sessionData } = await supabase.auth.getSession();
  const { data: userData } = await supabase.auth.getUser();

  const isAdmin =
    !!sessionData.session &&
    userData.user?.email === 'smisnerdesign@gmail.com';

  if (isAdmin) {
    panelEl.classList.remove('hidden');
    todayDateEl.textContent = new Date().toDateString();
  } else {
    loginEl?.classList.remove('hidden');
  }
}

bootstrapAdmin();

// Optional: reload page on auth state change
supabase.auth.onAuthStateChange(() => location.reload());