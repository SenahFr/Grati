window.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('archive-grid');
  const overlayLayer = document.getElementById('entry-overlay-layer');
  const hoverCard = document.getElementById('hover-image-card');
  const hoverImg = document.getElementById('hover-image');
  const archiveTimeZone = 'America/New_York';
  const archiveLength = 56;
  const overlayPalette = [
    'entry-panel--yellow',
    'entry-panel--green',
    'entry-panel--blue',
  ];

  if (!grid || !overlayLayer || !hoverCard || !hoverImg) {
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

  function getDatePartsInTimeZone(date, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {});
  }

  function getStorageKeyForTimeZone(date, timeZone) {
    const { year, month, day } = getDatePartsInTimeZone(date, timeZone);
    return `${year}-${month}-${day}`;
  }

  function shiftStorageKey(key, offsetDays) {
    const [year, month, day] = key.split('-').map(Number);
    const shiftedDate = new Date(Date.UTC(year, month - 1, day, 12));

    shiftedDate.setUTCDate(shiftedDate.getUTCDate() + offsetDays);

    return shiftedDate.toISOString().slice(0, 10);
  }

  function formatDisplayDateFromKey(key) {
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));

    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  function normalizePosts(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    if (items.every((item) => typeof item === 'string')) {
      return [items.filter(Boolean)];
    }

    return items
      .map((item) => {
        if (Array.isArray(item)) {
          return item.filter((entry) => typeof entry === 'string' && entry.trim());
        }

        if (item && Array.isArray(item.items)) {
          return item.items.filter((entry) => typeof entry === 'string' && entry.trim());
        }

        return [];
      })
      .filter((post) => post.length > 0);
  }

  function hasEntry(items) {
    return normalizePosts(items).length > 0;
  }

  function getLatestVisibleKey(entries) {
    const currentEasternKey = getStorageKeyForTimeZone(new Date(), archiveTimeZone);

    if (hasEntry(entries[currentEasternKey])) {
      return currentEasternKey;
    }

    return shiftStorageKey(currentEasternKey, -1);
  }

  function buildEntryList(items) {
    const list = document.createElement('ul');
    list.className = 'entry-list';

    items.forEach((item) => {
      const listItem = document.createElement('li');
      listItem.textContent = item;
      list.appendChild(listItem);
    });

    return list;
  }

  function getStableNumber(seed) {
    return seed.split('').reduce((sum, character, index) => {
      return (sum * 31 + character.charCodeAt(0) + index) % 2147483647;
    }, 7);
  }

  function getPseudoRandom(seed, min, max) {
    if (max <= min) {
      return min;
    }

    const normalized = (Math.sin(getStableNumber(seed)) + 1) / 2;
    return min + normalized * (max - min);
  }

  function closePanels(exceptButton) {
    grid.querySelectorAll('.date-link[aria-expanded="true"]').forEach((button) => {
      if (button !== exceptButton) {
        button.setAttribute('aria-expanded', 'false');
      }
    });

    overlayLayer.innerHTML = '';
  }

  function createEntryPanel(items, key, index) {
    const panel = document.createElement('div');
    panel.className = `entry-panel ${overlayPalette[index % overlayPalette.length]}`;
    panel.hidden = true;
    panel.dataset.key = key;
    panel.dataset.index = String(index);
    panel.appendChild(buildEntryList(items));
    return panel;
  }

  function placePanels(panels, key, button) {
    const overlayRect = overlayLayer.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const horizontalMargin = Math.max(12, Math.min(24, viewportWidth * 0.05));
    const verticalMargin = Math.max(12, Math.min(24, viewportHeight * 0.05));
    const gap = 12;
    const availableWidth = Math.max(220, viewportWidth - horizontalMargin * 2);
    const availableHeight = Math.max(180, viewportHeight - verticalMargin * 2);
    const baseTop = Math.max(
      window.scrollY + verticalMargin,
      window.scrollY + Math.min(buttonRect.bottom + 12, viewportHeight - verticalMargin - 120)
    );
    let currentRowTop = baseTop;
    let currentRowLeft = window.scrollX + horizontalMargin;
    let currentRowHeight = 0;

    panels.forEach((panel, index) => {
      overlayLayer.appendChild(panel);
      panel.hidden = false;

      const panelRect = panel.getBoundingClientRect();
      const panelWidth = Math.min(panelRect.width, availableWidth);
      const panelHeight = Math.min(panelRect.height, availableHeight);
      const rowEnd = window.scrollX + viewportWidth - horizontalMargin;

      if (currentRowLeft + panelWidth > rowEnd && currentRowLeft > window.scrollX + horizontalMargin) {
        currentRowTop += currentRowHeight + gap;
        currentRowLeft = window.scrollX + horizontalMargin;
        currentRowHeight = 0;
      }

      const maxTop = window.scrollY + viewportHeight - verticalMargin - panelHeight;
      const left = Math.min(currentRowLeft, rowEnd - panelWidth);
      const top = Math.min(currentRowTop, Math.max(window.scrollY + verticalMargin, maxTop));

      panel.style.left = `${Math.max(horizontalMargin, left - overlayRect.left - window.scrollX)}px`;
      panel.style.top = `${Math.max(verticalMargin, top - overlayRect.top - window.scrollY)}px`;
      currentRowLeft += panelWidth + gap;
      currentRowHeight = Math.max(currentRowHeight, panelHeight);

      requestAnimationFrame(() => panel.classList.add('active'));
    });
  }

  function toggleEntryPanels(button, items, key) {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      button.setAttribute('aria-expanded', 'false');
      closePanels();
      return;
    }

    const posts = normalizePosts(items);
    const panels = posts.map((post, index) => createEntryPanel(post, key, index));

    closePanels(button);
    button.setAttribute('aria-expanded', 'true');
    placePanels(panels, key, button);
  }

  function createDateLabel(display, items, key) {
    if (hasEntry(items)) {
      const button = document.createElement('button');

      button.type = 'button';
      button.className = 'date-link';
      button.textContent = display;
      button.setAttribute('aria-expanded', 'false');

      button.addEventListener('click', () => {
        toggleEntryPanels(button, items, key);
      });

      return [button];
    }

    const dateLabel = document.createElement('span');
    dateLabel.className = 'date-label';
    dateLabel.textContent = display;
    return [dateLabel];
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
      const latestVisibleKey = getLatestVisibleKey(entries);

      grid.innerHTML = '';
      overlayLayer.innerHTML = '';

      for (let i = 0; i < archiveLength; i += 1) {
        const key = shiftStorageKey(latestVisibleKey, -i);
        const items = entries[key];
        const display = formatDisplayDateFromKey(key);
        const cell = document.createElement('div');

        cell.className = 'grid-cell';
        cell.append(...createDateLabel(display, items, key));

        if (!hasEntry(items)) {
          cell.classList.add('empty');
        }

        grid.appendChild(cell);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  }

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.grid-cell') && !event.target.closest('.entry-panel')) {
      closePanels();
    }
  });

  window.addEventListener('resize', () => closePanels());

  renderArchive();
});