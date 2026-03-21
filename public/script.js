window.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('archive-grid');
  const hoverCard = document.getElementById('hover-image-card');
  const hoverImg = document.getElementById('hover-image');
  const sameDaySection = document.getElementById('same-day-section');
  const sameDayListContainer = document.getElementById('same-day-list-container');
  const archiveTimeZone = 'America/New_York';
  const archiveLength = 56;
  const sameDayPalette = [
    {
      background: 'var(--prayer-card-blue)',
      text: 'var(--bg-yellow)',
      className: 'same-day-list--blue',
    },
    {
      background: 'var(--bg-yellow)',
      text: 'var(--primary-green)',
      className: 'same-day-list--yellow',
    },
    {
      background: 'var(--primary-green)',
      text: 'var(--prayer-card-blue)',
      className: 'same-day-list--green',
    },
  ];
  if (!grid || !hoverCard || !hoverImg) {
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

  function hasEntry(items) {
    return Array.isArray(items) && items.length > 0;
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

  function createEntryPanel(items) {
    const panel = document.createElement('div');
    panel.className = 'entry-panel';
    panel.hidden = true;
    panel.appendChild(buildEntryList(items));
    return panel;
  }

  function closePanels(exceptButton, exceptPanel) {
    grid.querySelectorAll('.date-link[aria-expanded="true"]').forEach((button) => {
      if (button !== exceptButton) {
        button.setAttribute('aria-expanded', 'false');
      }
    });

    grid.querySelectorAll('.entry-panel.active').forEach((panel) => {
      if (panel !== exceptPanel) {
        panel.hidden = true;
        panel.classList.remove('active');
      }
    });
  }

  function toggleEntryPanel(button, panel) {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;

    closePanels(nextState ? button : null, nextState ? panel : null);
    button.setAttribute('aria-expanded', String(nextState));
    panel.hidden = !nextState;
    panel.classList.toggle('active', nextState);
  }

  function createDateLabel(display, items, key) {
    if (hasEntry(items)) {
      const button = document.createElement('button');
      const panelId = `entry-panel-${key}`;
      const panel = createEntryPanel(items);

      button.type = 'button';
      button.className = 'date-link';
      button.textContent = display;
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', panelId);

      panel.id = panelId;

      button.addEventListener('click', () => {
        toggleEntryPanel(button, panel);
      });

      return [button, panel];
    }

    const dateLabel = document.createElement('span');
    dateLabel.className = 'date-label';
    dateLabel.textContent = display;
    return [dateLabel];
  }

function getStableColorVariant(key) {
    const checksum = key
      .split('')
      .reduce((sum, character) => sum + character.charCodeAt(0), 0);

    return sameDayPalette[checksum % sameDayPalette.length];
  }

  function renderSameDayEntries(entries) {
    if (!sameDaySection || !sameDayListContainer) {
      return;
    }

    const duplicatedDays = Object.entries(entries)
      .filter(([, items]) => Array.isArray(items) && items.length > 1)
      .sort(([leftKey], [rightKey]) => rightKey.localeCompare(leftKey));

    sameDayListContainer.innerHTML = '';

    if (duplicatedDays.length === 0) {
      sameDaySection.hidden = true;
      return;
    }

    sameDaySection.hidden = false;

    duplicatedDays.forEach(([key, items]) => {
      const colorVariant = getStableColorVariant(key);
      const wrapper = document.createElement('article');
      const heading = document.createElement('h3');
      const list = document.createElement('ul');

      wrapper.className = `same-day-list ${colorVariant.className}`;
      wrapper.style.backgroundColor = colorVariant.background;
      wrapper.style.color = colorVariant.text;

      heading.className = 'same-day-list__date';
      heading.textContent = formatDisplayDateFromKey(key);

      list.className = 'same-day-list__entries';

      items.forEach((item) => {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        list.appendChild(listItem);
      });

      wrapper.append(heading, list);
      sameDayListContainer.appendChild(wrapper);
    });
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

      renderSameDayEntries(entries);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  }

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.grid-cell')) {
      closePanels();
    }
  });

  renderArchive();
});