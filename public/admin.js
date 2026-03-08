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

  const statusResponse = await fetch('/admin/status');
  const status = await statusResponse.json();

  const params = new URLSearchParams(window.location.search);
  if (params.get('error') === '1') {
    errorEl.classList.remove('hidden');
  }

  if (status.authenticated) {
    panelEl.classList.remove('hidden');
    todayDateEl.textContent = formatLongDate(new Date());
  } else {
    loginEl.classList.remove('hidden');
  }
}

bootstrapAdmin();