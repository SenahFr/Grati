const express = require('express');
const path = require('path');
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gratitude';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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

function todayKey() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter
    .formatToParts(new Date())
    .filter((part) => part.type !== 'literal')
    .reduce((result, part) => ({ ...result, [part.type]: part.value }), {});

  return `${parts.year}-${parts.month}-${parts.day}`;
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

app.post('/entry', async (req, res) => {
  if (!req.session?.authenticated) {
    return res.status(401).send('Unauthorized');
  }

  const text = (req.body?.text || '').trim();
  const items = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!items.length) {
    return res.redirect(303, '/admin');
  }

  const date = todayKey();
  const { data: existingEntry, error: existingEntryError } = await supabase
    .from('entries')
    .select('items')
    .eq('date', date)
    .maybeSingle();

  if (existingEntryError) {
    console.error(existingEntryError);
    return res.status(500).send('Database error');
  }

  const posts = normalizePosts(existingEntry?.items);
  posts.push(items);

  const { error } = await supabase.from('entries').upsert([
    {
      date,
      items: posts,
    },
  ]);

  if (error) {
    console.error(error);
    return res.status(500).send('Database error');
  }

  return res.redirect(303, '/');
});

app.use('/fonts', express.static(path.join(__dirname, 'fonts')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, storage: 'supabase' });
});

app.get('/entries', async (_req, res) => {
  const { data, error } = await supabase.from('entries').select('*');

  if (error) return res.status(500).json({ error });

  const formatted = {};
  data.forEach((row) => {
    formatted[row.date] = row.items;
  });

  res.json(formatted);
});

function sendAdminPage(res) {
  return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
}

app.get('/admin', (_req, res) => sendAdminPage(res));
app.get('/admin/', (_req, res) => sendAdminPage(res));

app.get('/admin/status', (req, res) => {
  res.json({ authenticated: Boolean(req.session?.authenticated) });
});

app.get('/admin/login', (_req, res) => sendAdminPage(res));
app.get('/admin/login/', (_req, res) => sendAdminPage(res));

app.post('/admin/login', (req, res) => {
  const password = req.body?.password || '';

  if (password !== ADMIN_PASSWORD) {
    return res.redirect(303, '/admin?error=1');
  }

  req.session.authenticated = true;
  return req.session.save((error) => {
    if (error) {
      console.error('Admin login session save error:', error);
      return res.redirect(303, '/admin?error=1');
    }

    return res.redirect(303, '/admin');
  });
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect(303, '/admin');
  });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    const storageMode = 'supabase';
    console.log(`Gratitude archive running on http://localhost:${PORT} (storage: ${storageMode})`);
  });
}

module.exports = app;