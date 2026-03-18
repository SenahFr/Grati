import { supabase } from './lib/supabase';
function formatLongDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function bootstrapAdmin() {
  const loginEl = document.getElementById('admin-login');
  const panelEl = document.getElementById('admin-panel');
  const errorEl = document.getElementById('login-error');
  const todayDateEl = document.getElementById('today-date');

  // Get session + user
  const { data: sessionData } = await supabase.auth.getSession();
  const { data: userData } = await supabase.auth.getUser();

  // Single, correct admin check
  const isAdmin =
    !!sessionData.session &&
    userData.user?.email === 'smisnerdesign@gmail.com';

  const params = new URLSearchParams(window.location.search);
  if (params.get('error') === '1') {
    errorEl.classList.remove('hidden');
  }

  if (isAdmin) {
    panelEl.classList.remove('hidden');
    todayDateEl.textContent = formatLongDate(new Date());
  } else {
    loginEl.classList.remove('hidden');
  }
}

bootstrapAdmin();