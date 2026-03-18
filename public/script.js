import { supabase } from './lib/supabase.js';

window.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('archive-grid');
  const hoverCard = document.getElementById('hover-image-card');
  const hoverImg = document.getElementById('hover-image');

  // --- Hover images ---
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      hoverImg.src = item.dataset.image;
      hoverCard.style.display = 'block';
    });
    item.addEventListener('mouseleave', () => {
      hoverCard.style.display = 'none';
    });
  });

  // --- Archive grid ---
  function formatStorageKey(date) {
    return date.toISOString().split('T')[0];
  }

  function formatDisplayDate(date) {
    return date.toDateString();
  }

  function buildEntryList(items) {
    const ul = document.createElement('ul');
    items.forEach(i => {
      const li = document.createElement('li');
      li.textContent = i;
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
    try {
      const { data, error } = await supabase.from('entries').select('*');
      if (error) throw error;

      const entries = {};
      data.forEach(entry => {
        const key = formatStorageKey(new Date(entry.created_at));
        if (!entries[key]) entries[key] = [];
        entries[key].push(entry.content);
      });

      const today = new Date();
      for (let i = 0; i < 56; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const key = formatStorageKey(date);
        const items = entries[key];
        const display = formatDisplayDate(date);

        const cell = document.createElement('div');
        cell.className = 'grid-cell';

        if (Array.isArray(items) && items.length > 0) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'date-link';
          btn.textContent = display;
          btn.addEventListener('click', () =>
            placeEntryPanel(cell, buildEntryList(items))
          );
          cell.appendChild(btn);
        } else {
          cell.classList.add('empty');
        }

        grid.appendChild(cell);
      }
    } catch (err) {
      console.error('Error loading entries:', err);
    }
  }

  renderArchive();
});