window.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('archive-grid');
  const overlayLayer = document.getElementById('entry-overlay-layer');
  const hoverCard = document.getElementById('hover-image-card');
  const hoverImg = document.getElementById('hover-image');
  const archiveTimeZone = 'America/New_York';
  const archiveLength = 56;

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
  const handlePrayerCardOpen = () => {
    if (window.innerWidth <= 700) {
      closePanels();
    }
    showHoverImage(item);
  };

  item.addEventListener('mouseenter', handlePrayerCardOpen);
  item.addEventListener('focusin', handlePrayerCardOpen);
  item.addEventListener('touchstart', handlePrayerCardOpen, { passive: true });

  item.addEventListener('mouseleave', hideHoverImage);
  item.addEventListener('focusout', hideHoverImage);
  item.addEventListener('touchend', () => {
    // keep visible briefly on touch if needed; remove if you want it to disappear instantly
  });
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
    if (!items) return [];

    if (typeof items === 'string') {
      return [[items].filter(Boolean)];
    }

    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    if (items.every((item) => typeof item === 'string')) {
      return [items.filter((item) => typeof item === 'string' && item.trim())];
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

    let colorClass = 'entry-panel--yellow';
    if (index > 0) {
      const randomPalette = [
        'entry-panel--yellow',
        'entry-panel--green',
        'entry-panel--blue',
      ];
      colorClass = randomPalette[Math.floor(Math.random() * randomPalette.length)];
    }

    panel.className = `entry-panel ${colorClass}`;
    panel.hidden = true;
    panel.dataset.key = key;
    panel.dataset.index = String(index);

    if (colorClass === 'entry-panel--blue') {
      panel.classList.add('entry-panel--text-yellow');
    }

    if (colorClass === 'entry-panel--green') {
      panel.classList.add('entry-panel--text-blue');
    }

    panel.appendChild(buildEntryList(items));
    return panel;
  }

 function placePanels(panels, key, button) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth <= 700;

  overlayLayer.innerHTML = '';

  if (isMobile) {
    const padding = 16;
    const gap = 14;

    // Safe zone below title + prayer links
    const safeTop = 220;
    let currentTop = safeTop;

    panels.forEach((panel, index) => {
      overlayLayer.appendChild(panel);
      panel.hidden = false;
      panel.style.position = 'fixed';

      const panelWidth = Math.min(320, viewportWidth - padding * 2);
      const stagger = index % 2 === 0 ? -6 : 6;

      panel.style.width = `${panelWidth}px`;
      panel.style.left = `${Math.max(padding, (viewportWidth - panelWidth) / 2 + stagger)}px`;
      panel.style.top = `${currentTop}px`;

      const panelRect = panel.getBoundingClientRect();
      currentTop += panelRect.height + gap;

      requestAnimationFrame(() => panel.classList.add('active'));
    });

    return;
  }

  const buttonRect = button.getBoundingClientRect();
  const zones = [
    { x: 0.22, y: 0.42 },
    { x: 0.5, y: 0.3 },
    { x: 0.76, y: 0.54 },
  ];

  const usedPositions = [];
  const padding = 24;

  panels.forEach((panel, index) => {
    overlayLayer.appendChild(panel);
    panel.hidden = false;
    panel.style.position = 'fixed';

    const panelRect = panel.getBoundingClientRect();
    const panelWidth = panelRect.width || 300;
    const panelHeight = panelRect.height || 180;

    let attempts = 0;
    let left = 0;
    let top = 0;

    while (attempts < 30) {
      if (index === 0) {
        left = Math.min(
          Math.max(padding, buttonRect.left + 24),
          viewportWidth - panelWidth - padding
        );
        top = Math.min(
          Math.max(140, buttonRect.bottom + 12),
          viewportHeight - panelHeight - padding
        );
      } else {
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const baseX = viewportWidth * zone.x;
        const baseY = viewportHeight * zone.y;
        const jitterX = (Math.random() - 0.5) * 180;
        const jitterY = (Math.random() - 0.5) * 120;

        left = baseX + jitterX;
        top = baseY + jitterY;

        left = Math.max(
          padding,
          Math.min(left, viewportWidth - panelWidth - padding)
        );

        top = Math.max(
          140,
          Math.min(top, viewportHeight - panelHeight - padding)
        );
      }

      const overlaps = usedPositions.some((pos) => {
        return (
          Math.abs(pos.left - left) < 240 &&
          Math.abs(pos.top - top) < 150
        );
      });

      if (!overlaps) break;
      attempts += 1;
    }

    usedPositions.push({ left, top });

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;

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
      const res = await fetch('/entries');

      if (!res.ok) {
        throw new Error(`Failed to load entries: ${res.status}`);
      }

      const entries = await res.json();

      grid.innerHTML = '';
      closePanels();

      const latestVisibleKey = getLatestVisibleKey(entries);

      for (let index = 0; index < archiveLength; index += 1) {
        const key = shiftStorageKey(latestVisibleKey, -index);
        const display = formatDisplayDateFromKey(key);
        const cell = document.createElement('div');
        cell.className = 'grid-cell';

        const dateElements = createDateLabel(display, entries[key], key);
        dateElements.forEach((element) => cell.appendChild(element));

        grid.appendChild(cell);
      }
    } catch (error) {
      console.error('renderArchive error:', error);
    }
  }

  renderArchive();

  window.addEventListener('resize', () => {
    closePanels();
  });
});