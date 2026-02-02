const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 SERVE FRONTEND
app.use(express.static(path.join(__dirname, 'public')));

const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '21091234@';
const REQUIRED_SIGNS = 9;
const PVP_DELAY = 5 * 60 * 60 * 1000;

let signedUsers = [];
let pendingLaws = [];
let approvedLaws = [];
let serverStart = null;

// ---- API ROUTES ----
app.post('/sign', (req, res) => {
  const { realname, mcname } = req.body;
  if (!realname || !mcname) return res.status(400).json({ error: 'Missing fields' });

  if (signedUsers.find(u => u.mcname === mcname)) {
    return res.status(409).json({ error: 'Already signed' });
  }

  signedUsers.push({ realname, mcname });

  if (signedUsers.length === REQUIRED_SIGNS && !serverStart) {
    serverStart = Date.now();
  }

  res.json({ signed: signedUsers.length, serverStart });
});

app.post('/law', (req, res) => {
  pendingLaws.push(req.body);
  res.json({ ok: true });
});

app.post('/approve', (req, res) => {
  if (req.body.password !== OWNER_PASSWORD) {
    return res.status(403).json({ error: 'Wrong password' });
  }

  const law = pendingLaws.splice(req.body.index, 1)[0];
  if (!law) return res.status(400).json({ error: 'Invalid index' });

  approvedLaws.push(law);
  res.json({ ok: true });
});

app.get('/state', (req, res) => {
  res.json({ signed: signedUsers.length, pendingLaws, approvedLaws, serverStart });
});

app.get('/pvp', (req, res) => {
  if (!serverStart) return res.json({ active: false });
  res.json({
    active: true,
    remaining: Math.max(0, serverStart + PVP_DELAY - Date.now())
  });
});

// ---- START SERVER ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ OurSMP running on http://localhost:${PORT}`);
});