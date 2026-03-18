import { supabase } from '/src/lib/supabase.js';

const grid = document.getElementById('archive-grid');

function formatStorageKey(date) {
  return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
}

function formatDisplayDate(date) {
  return date.toDateString();
}

function buildEntryList(items) {
  const ul = document.createElement('ul');
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });
  return ul;
}

function placeEntryPanel(cell, content) {
  const panel = document.getElementById('entry-panel');
  panel.innerHTML = '';
  panel.appendChild(content);
}

async function renderArchive() {
  const { data, error } = await supabase.from('entries').select('*');

  if (error) {
    console.error(error);
    return;
  }

  const entries = {};
  data.forEach(entry => {
    const date = new Date(entry.created_at);
    const key = formatStorageKey(date);
    if (!entries[key]) entries[key] = [];
    entries[key].push(entry.content);
  });

  const today = new Date();
  for (let i = 0; i < 56; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = formatStorageKey(date);
    const display = formatDisplayDate(date);
    const items = entries[key];

    const cell = document.createElement('div');
    cell.className = 'grid-cell';

    if (Array.isArray(items) && items.length > 0) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'date-link';
      button.textContent = display;
      button.addEventListener('click', () =>
        placeEntryPanel(cell, buildEntryList(items))
      );
      cell.appendChild(button);
    } else {
      cell.classList.add('empty');
    }

    grid.appendChild(cell);
  }
}

renderArchive();

// Hover images
document.querySelectorAll('.nav-item').forEach(item => {
  const imgEl = document.getElementById('hover-image');
  const hoverCard = document.getElementById('hover-image-card');
  item.addEventListener('mouseenter', () => {
    imgEl.src = item.dataset.image;
    hoverCard.style.display = 'block';
  });
  item.addEventListener('mouseleave', () => {
    hoverCard.style.display = 'none';
  });
});