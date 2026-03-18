const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gratitude';

function resolveEntriesPath() {
  const configuredDir = process.env.DATA_DIR;
  const candidates = [
    configuredDir ? path.join(configuredDir, 'entries.json') : null,
    path.join(__dirname, 'entries.json'),
    path.join('/tmp', 'entries.json'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      fs.mkdirSync(path.dirname(candidate), { recursive: true });
      if (!fs.existsSync(candidate)) {
        fs.writeFileSync(candidate, JSON.stringify({}, null, 2));
      }
      fs.accessSync(candidate, fs.constants.R_OK | fs.constants.W_OK);
      return candidate;
    } catch (_err) {
      // Try the next location.
    }
  }

  return null;
}

const ENTRIES_PATH = resolveEntriesPath();
let inMemoryEntries = {};

function ensureEntriesFile() {
  if (!ENTRIES_PATH) {
    return false;
  }

  if (!fs.existsSync(ENTRIES_PATH)) {
    fs.writeFileSync(ENTRIES_PATH, JSON.stringify({}, null, 2));
  }

  return true;
}

function loadEntries() {
  if (!ensureEntriesFile()) {
    return inMemoryEntries;
  }

  try {
    const raw = fs.readFileSync(ENTRIES_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (_err) {
    return {};
  }
}

function saveEntries(entries) {
  if (!ENTRIES_PATH) {
    inMemoryEntries = entries;
    return true;
  }

  try {
    fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2));
    return true;
  } catch (_err) {
    inMemoryEntries = entries;
    return false;
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'gratitude-archive-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    },
  })
);

app.use('/fonts', express.static(path.join(__dirname, 'fonts')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, storage: ENTRIES_PATH ? 'file' : 'memory' });
});

app.get('/entries', (_req, res) => {
  res.json(loadEntries());
});

app.post('/entry', (req, res) => {
  if (!req.session?.authenticated) {
    return res.status(401).send('Unauthorized');
  }

  const text = (req.body?.text || '').trim();
  if (!text) {
    return res.redirect(303, '/admin');
  }

  const items = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!items.length) {
    return res.redirect(303, '/admin');
  }

  const entries = loadEntries();
  entries[todayKey()] = items;

  saveEntries(entries);

  return res.redirect(303, '/');
});

app.get('/admin', (req, res) => {
  if (!req.session?.authenticated) {
    return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  }

  return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/status', (req, res) => {
  res.json({ authenticated: Boolean(req.session?.authenticated) });
});

app.post('/admin/login', (req, res) => {
  const password = req.body?.password || '';

  if (password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.redirect(303, '/admin');
  }

  return res.redirect(303, '/admin?error=1');
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect(303, '/admin');
  });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureEntriesFile();
app.listen(PORT, () => {
  const storageMode = ENTRIES_PATH ? ENTRIES_PATH : 'in-memory fallback';
  console.log(`Gratitude archive running on http://localhost:${PORT} (storage: ${storageMode})`);
});