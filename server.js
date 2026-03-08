const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const ENTRIES_PATH = path.join(__dirname, 'entries.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gratitude';

function ensureEntriesFile() {
  if (!fs.existsSync(ENTRIES_PATH)) {
    fs.writeFileSync(ENTRIES_PATH, JSON.stringify({}, null, 2));
  }
}

function loadEntries() {
  ensureEntriesFile();
  try {
    const raw = fs.readFileSync(ENTRIES_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (_err) {
    return {};
  }
}

function saveEntries(entries) {
  fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2));
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

app.get('/entries', (_req, res) => {
  res.json(loadEntries());
});

app.post('/entry', (req, res) => {
  if (!req.session?.authenticated) {
    return res.status(401).send('Unauthorized');
  }

  const text = (req.body?.text || '').trim();
  if (!text) {
    return res.redirect('/admin');
  }

  const items = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!items.length) {
    return res.redirect('/admin');
  }

  const entries = loadEntries();
  entries[todayKey()] = items;
  saveEntries(entries);

  return res.redirect('/');
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
    return res.redirect('/admin');
  }

  return res.redirect('/admin?error=1');
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin');
  });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureEntriesFile();
app.listen(PORT, () => {
  console.log(`Gratitude archive running on http://localhost:${PORT}`);
});
