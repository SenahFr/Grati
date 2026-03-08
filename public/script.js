const grid = document.getElementById('archive-grid');
const panel = document.getElementById('entry-panel');

function formatDisplayDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}.${dd}.${yyyy}`;
}

function formatStorageKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function buildEntryList(items) {
  return `<ul>${items.map((item) => `<li>+ ${item}</li>`).join('')}</ul>`;
}

function placeEntryPanel(cell, html) {
  panel.innerHTML = html;
  panel.classList.add('active');

  const wrapperRect = grid.parentElement.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();

  panel.style.left = `${cellRect.left - wrapperRect.left}px`;
  panel.style.top = `${cellRect.bottom - wrapperRect.top + 8}px`;
}

async function renderArchive() {
  const response = await fetch('/entries');
  const entries = await response.json();

  const today = new Date();
  for (let i = 0; i < 56; i += 1) {
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
      button.addEventListener('click', () => placeEntryPanel(cell, buildEntryList(items)));
      cell.appendChild(button);
    } else {
      cell.classList.add('empty');
    }

    grid.appendChild(cell);
  }
}

function setupHoverImages() {
  const card = document.getElementById('hover-image-card');
  const image = document.getElementById('hover-image');
  const page = document.querySelector('.page');

  const preloadPromises = new Map();
  const preloadImage = (src) => {
    if (!src) {
      return Promise.resolve();
    }

    if (preloadPromises.has(src)) {
      return preloadPromises.get(src);
    }

    const promise = new Promise((resolve) => {
      const preloadedImage = new Image();
      preloadedImage.onload = () => resolve(true);
      preloadedImage.onerror = () => resolve(false);
      preloadedImage.src = src;
    });

    preloadPromises.set(src, promise);
    return promise;
  };

  const navItems = Array.from(document.querySelectorAll('.nav-item'));
  navItems.forEach((item) => preloadImage(item.dataset.image));

  navItems.forEach((item) => {
    const heading = item.querySelector('.hover-heading');
    const src = item.dataset.image;
    let isActiveHover = false;

    const positionCard = () => {
      const itemRect = item.getBoundingClientRect();
      const pageRect = page.getBoundingClientRect();
      const left = itemRect.left + itemRect.width / 2 - card.offsetWidth / 2 - pageRect.left;
      card.style.left = `${Math.max(0, left)}px`;
    };

    const show = async () => {
      isActiveHover = true;
      await preloadImage(src);

      if (!isActiveHover) {
        return;
      }

      if (image.getAttribute('src') !== src) {
        image.setAttribute('src', src);
      }

      positionCard();
      card.classList.add('active');
    };

    const hide = () => {
      isActiveHover = false;
      card.classList.remove('active');
    };

    item.addEventListener('mouseenter', show);
    item.addEventListener('mouseleave', hide);
    heading.addEventListener('focus', show);
    heading.addEventListener('blur', hide);
    heading.addEventListener('click', (event) => event.preventDefault());
  });
}

renderArchive();
setupHoverImages();
window.addEventListener('resize', () => panel.classList.remove('active'));