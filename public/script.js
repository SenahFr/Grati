window.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('archive-grid');
  const hoverCard = document.getElementById('hover-image-card');
  const hoverImg = document.getElementById('hover-image');
const entryPanel = document.getElementById('entry-panel');

  if (!grid || !hoverCard || !hoverImg || !entryPanel) {
    return;
  }

  function showHoverImage(item) {
    const imagePath = item.dataset.image;
    if (!imagePath) {
      return;
    }

    const itemRect = item.getBoundingClientRect();
    const page = hoverCard.closest('.page');
    const pageRect = (page || document.body).getBoundingClientRect();
    const hoverCardWidth = hoverCard.offsetWidth || 280;
    const left = itemRect.left + itemRect.width / 2 - pageRect.left;
    const top = itemRect.bottom - pageRect.top + 18;
    const minLeft = hoverCardWidth / 2 + 24;
    const maxLeft = pageRect.width - hoverCardWidth / 2 - 24;

    hoverImg.src = imagePath;
    hoverCard.style.left = `${Math.min(Math.max(left, minLeft), maxLeft)}px`;
    hoverCard.style.top = `${top}px`;
    hoverCard.style.display = 'block';
    hoverCard.classList.add('active');
  }

  function hideHoverImage() {
    hoverCard.classList.remove('active');
    hoverCard.style.display = 'none';
  }

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('mouseenter', () => showHoverImage(item));
    item.addEventListener('focusin', () => showHoverImage(item));
    item.addEventListener('mouseleave', hideHoverImage);
    item.addEventListener('focusout', hideHoverImage);
  });

  function formatStorageKey(date) {
    return date.toISOString().split('T')[0];
  }

  function formatDisplayDate(date) {
    return date.toDateString();
  }

  function buildEntryList(items) {
    const list = document.createElement('ul');

    items.forEach((item) => {
      const listItem = document.createElement('li');
      listItem.textContent = item;
      list.appendChild(listItem);
    });

    return list;
  }

  function placeEntryPanel(content) {
    entryPanel.innerHTML = '';
    entryPanel.appendChild(content);
    entryPanel.classList.add('active');
  }

  async function renderArchive() {
    try {
      const response = await fetch('/entries', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const entries = await response.json();
      const today = new Date();

      for (let i = 0; i < 56; i += 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const key = formatStorageKey(date);
        const items = entries[key];
        const display = formatDisplayDate(date);
        const cell = document.createElement('div');

        cell.className = 'grid-cell';

        if (Array.isArray(items) && items.length > 0) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'date-link';
          button.textContent = display;
          button.addEventListener('click', () => {
            placeEntryPanel(buildEntryList(items));
          });
          cell.appendChild(button);
        } else {
          cell.classList.add('empty');
        }

        grid.appendChild(cell);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  }

  renderArchive();
});