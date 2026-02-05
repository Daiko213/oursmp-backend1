const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const REQUIRED_SIGNS = 9;
const OWNER_PASSWORD = '21091234@';

// ---------------- STATE ----------------
let signedUsers = [];
let serverStart = null;

let rules = [
  'No griefing.',
  'Respect all players.',
  'No stealing.',
  'No abusing bugs.',
  'PvP is only allowed after the grace period.',
  'Listen to admins and the Owner.',
  'Have fun.',
  'On the Matter of Arcane Tools and Modifications:\n\nAllowed Practices:\n• The use of X-ray vision, automated mining, and automated construction is permitted.\n• The use of auto-totem is permitted strictly outside of any PvP combat.\n\nForbidden Practices:\n• Any enchantments or tools that reveal the location of structures such as Strongholds or Nether Fortresses are forbidden.\n• Any modifications that grant an advantage in PvP combat are forbidden.\n\nAll cases are judged by the Owner.'
];

let pendingRules = [];

// ---------------- RULES ----------------
app.get('/rules', (req, res) => {
  res.json({ rules });
});

// Request a new rule
app.post('/rule/request', (req, res) => {
  const { text, reason } = req.body;
  if (!text || !reason) {
    return res.status(400).json({ error: 'Missing rule or reason' });
  }

  pendingRules.push({ text, reason });
  res.json({ ok: true });
});

// Approve rule (owner)
app.post('/rule/approve', (req, res) => {
  const { password, index } = req.body;
  if (password !== OWNER_PASSWORD) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const rule = pendingRules.splice(index, 1)[0];
  if (!rule) {
    return res.status(400).json({ error: 'Invalid index' });
  }

  rules.push(rule.text);
  res.json({ ok: true });
});

// ---------------- SIGNING ----------------
app.post('/sign', (req, res) => {
  const { realname, mcname } = req.body;

  if (!realname || !mcname) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  if (signedUsers.find(u => u.mcname === mcname)) {
    return res.status(409).json({ error: 'Already signed' });
  }

  if (signedUsers.length >= REQUIRED_SIGNS) {
    return res.status(403).json({ error: 'Contract is full' });
  }

  signedUsers.push({ realname, mcname });

  if (signedUsers.length === REQUIRED_SIGNS && !serverStart) {
    serverStart = Date.now();
  }

  res.json({
    signed: signedUsers.length,
    max: REQUIRED_SIGNS
  });
});

// ---------------- STATUS ----------------
app.get('/status', (req, res) => {
  res.json({
    signed: signedUsers.length,
    max: REQUIRED_SIGNS,
    open: signedUsers.length < REQUIRED_SIGNS
  });
});

// ---------------- OWNER RESET ----------------
app.post('/reset', (req, res) => {
  if (req.body.password !== OWNER_PASSWORD) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  signedUsers = [];
  serverStart = null;

  res.json({ ok: true });
});

// ---------------- START ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ OurSMP backend running on port ${PORT}`);
});
