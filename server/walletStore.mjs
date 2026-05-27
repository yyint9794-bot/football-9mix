import crypto from 'node:crypto';
import { readDb, writeDb } from './walletStorage.mjs';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) {
    return false;
  }
  const next = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(next, 'hex'));
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    balance: user.balance,
    active: user.active,
    displayName: user.displayName || user.username,
    createdAt: user.createdAt,
    termsAccepted: Boolean(user.termsAcceptedAt),
  };
}

function publicTransaction(tx) {
  return {
    id: tx.id,
    userId: tx.userId,
    username: tx.username,
    type: tx.type,
    amount: tx.amount,
    status: tx.status,
    note: tx.note || '',
    createdBy: tx.createdBy,
    createdAt: tx.createdAt,
    reviewedAt: tx.reviewedAt || null,
    reviewedBy: tx.reviewedBy || null,
  };
}

async function getUserFromToken(token) {
  if (!token) {
    return null;
  }
  const db = await readDb();
  const userId = db.sessions[token];
  if (!userId) {
    return null;
  }
  const user = db.users.find((entry) => entry.id === userId);
  if (!user || !user.active) {
    return null;
  }
  return user;
}

export async function walletLogin(username, password) {
  const db = await readDb();
  const user = db.users.find(
    (entry) => entry.username.toLowerCase() === String(username).trim().toLowerCase(),
  );

  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return { error: 'Username သို့မဟုတ် Password မှားနေပါတယ်' };
  }

  const token = newId('sess');
  db.sessions[token] = user.id;
  await writeDb(db);
  return { token, user: publicUser(user) };
}

export async function walletLogout(token) {
  const db = await readDb();
  delete db.sessions[token];
  await writeDb(db);
  return { ok: true };
}

export async function walletMe(token) {
  const user = await getUserFromToken(token);
  if (!user) {
    return { error: 'Session မရှိပါ' };
  }
  return { user: publicUser(user) };
}

export async function walletAcceptTerms(token) {
  const user = await getUserFromToken(token);
  if (!user) {
    return { error: 'Session မရှိပါ' };
  }

  const db = await readDb();
  const record = db.users.find((entry) => entry.id === user.id);
  if (!record) {
    return { error: 'User မတွေ့ပါ' };
  }

  record.termsAcceptedAt = new Date().toISOString();
  await writeDb(db);
  return { user: publicUser(record) };
}

export async function adminListUsers(token) {
  const admin = await getUserFromToken(token);
  if (!admin || admin.role !== 'admin') {
    return { error: 'Admin ခွင့်ပြုချက် လိုအပ်ပါတယ်' };
  }
  const db = await readDb();
  return { users: db.users.map(publicUser) };
}

export async function adminCreateUser(token, payload) {
  const admin = await getUserFromToken(token);
  if (!admin || admin.role !== 'admin') {
    return { error: 'Admin ခွင့်ပြုချက် လိုအပ်ပါတယ်' };
  }

  const username = String(payload.username || '').trim();
  const password = String(payload.password || '').trim();
  const displayName = String(payload.displayName || username).trim();
  const balance = Number(payload.balance || 0);

  if (!username || !password) {
    return { error: 'Username နှင့် Password ထည့်ပါ' };
  }

  const db = await readDb();
  if (db.users.some((entry) => entry.username.toLowerCase() === username.toLowerCase())) {
    return { error: 'Username ရှိပြီးသားပါ' };
  }

  const user = {
    id: newId('user'),
    username,
    passwordHash: hashPassword(password),
    role: 'user',
    balance: Number.isFinite(balance) ? Math.max(0, balance) : 0,
    active: true,
    displayName,
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);

  if (user.balance > 0) {
    db.transactions.unshift({
      id: newId('tx'),
      userId: user.id,
      username: user.username,
      type: 'deposit',
      amount: user.balance,
      status: 'completed',
      note: 'အကောင့်ဖွင့်စဉ် ပထမသွင်း',
      createdBy: admin.username,
      createdAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: admin.username,
    });
  }

  await writeDb(db);
  return { user: publicUser(user) };
}

export async function adminUpdateUser(token, userId, payload) {
  const admin = await getUserFromToken(token);
  if (!admin || admin.role !== 'admin') {
    return { error: 'Admin ခွင့်ပြုချက် လိုအပ်ပါတယ်' };
  }

  const db = await readDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) {
    return { error: 'User မတွေ့ပါ' };
  }

  if (payload.password) {
    user.passwordHash = hashPassword(String(payload.password));
  }
  if (payload.displayName !== undefined) {
    user.displayName = String(payload.displayName).trim() || user.username;
  }
  if (payload.active !== undefined) {
    user.active = Boolean(payload.active);
  }
  if (payload.balance !== undefined) {
    const nextBalance = Number(payload.balance);
    if (!Number.isFinite(nextBalance) || nextBalance < 0) {
      return { error: 'လက်ကျန်ငွေ မမှန်ပါ' };
    }
    const diff = nextBalance - user.balance;
    if (diff !== 0) {
      db.transactions.unshift({
        id: newId('tx'),
        userId: user.id,
        username: user.username,
        type: diff > 0 ? 'deposit' : 'withdraw',
        amount: Math.abs(diff),
        status: 'completed',
        note: String(payload.balanceNote || 'Admin လက်ကျန်ပြင်ဆင်'),
        createdBy: admin.username,
        createdAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: admin.username,
      });
      user.balance = nextBalance;
    }
  }

  await writeDb(db);
  return { user: publicUser(user) };
}

export async function adminListTransactions(token, filters = {}) {
  const admin = await getUserFromToken(token);
  if (!admin || admin.role !== 'admin') {
    return { error: 'Admin ခွင့်ပြုချက် လိုအပ်ပါတယ်' };
  }

  const db = await readDb();
  let rows = [...db.transactions];
  if (filters.userId) {
    rows = rows.filter((tx) => tx.userId === filters.userId);
  }
  if (filters.status) {
    rows = rows.filter((tx) => tx.status === filters.status);
  }
  return { transactions: rows.map(publicTransaction) };
}

export async function adminPostTransaction(token, payload) {
  const admin = await getUserFromToken(token);
  if (!admin || admin.role !== 'admin') {
    return { error: 'Admin ခွင့်ပြုချက် လိုအပ်ပါတယ်' };
  }

  const userId = String(payload.userId || '');
  const type = payload.type === 'withdraw' ? 'withdraw' : 'deposit';
  const amount = Number(payload.amount);
  const note = String(payload.note || '').trim();

  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    return { error: 'User နှင့် ငွေပမာဏ ထည့်ပါ' };
  }

  const db = await readDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) {
    return { error: 'User မတွေ့ပါ' };
  }

  if (type === 'withdraw' && user.balance < amount) {
    return { error: 'လက်ကျန်ငွေ မလုံလောက်ပါ' };
  }

  const tx = {
    id: newId('tx'),
    userId: user.id,
    username: user.username,
    type,
    amount,
    status: 'completed',
    note: note || (type === 'deposit' ? 'Admin ငွေသွင်း' : 'Admin ငွေထုတ်'),
    createdBy: admin.username,
    createdAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    reviewedBy: admin.username,
  };

  user.balance = type === 'deposit' ? user.balance + amount : user.balance - amount;
  db.transactions.unshift(tx);
  await writeDb(db);
  return { transaction: publicTransaction(tx), user: publicUser(user) };
}

export async function adminReviewTransaction(token, txId, decision, note = '') {
  const admin = await getUserFromToken(token);
  if (!admin || admin.role !== 'admin') {
    return { error: 'Admin ခွင့်ပြုချက် လိုအပ်ပါတယ်' };
  }

  const db = await readDb();
  const tx = db.transactions.find((entry) => entry.id === txId);
  if (!tx || tx.status !== 'pending') {
    return { error: 'Pending လုပ်ဆောင်ချက် မတွေ့ပါ' };
  }

  const user = db.users.find((entry) => entry.id === tx.userId);
  if (!user) {
    return { error: 'User မတွေ့ပါ' };
  }

  if (decision === 'approve') {
    if (tx.type === 'withdraw' && user.balance < tx.amount) {
      return { error: 'လက်ကျန်ငွေ မလုံလောက်ပါ' };
    }
    user.balance = tx.type === 'deposit' ? user.balance + tx.amount : user.balance - tx.amount;
    tx.status = 'completed';
  } else {
    tx.status = 'rejected';
  }

  tx.reviewedAt = new Date().toISOString();
  tx.reviewedBy = admin.username;
  tx.note = note || tx.note;
  await writeDb(db);
  return { transaction: publicTransaction(tx), user: publicUser(user) };
}

export async function userListTransactions(token) {
  const user = await getUserFromToken(token);
  if (!user) {
    return { error: 'Session မရှိပါ' };
  }
  const db = await readDb();
  const rows = db.transactions.filter((tx) => tx.userId === user.id);
  return { transactions: rows.map(publicTransaction) };
}

export async function userRequestTransaction(token, type, amount, note = '') {
  const user = await getUserFromToken(token);
  if (!user) {
    return { error: 'Session မရှိပါ' };
  }

  const actor = user;
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return { error: 'ငွေပမာဏ ထည့်ပါ' };
  }

  if (type === 'withdraw' && actor.balance < parsedAmount) {
    return { error: 'လက်ကျန်ငွေ မလုံလောက်ပါ' };
  }

  const db = await readDb();
  const tx = {
    id: newId('tx'),
    userId: actor.id,
    username: actor.username,
    type: type === 'withdraw' ? 'withdraw' : 'deposit',
    amount: parsedAmount,
    status: 'pending',
    note: String(note || '').trim() || (type === 'withdraw' ? 'ငွေထုတ်တောင်းဆို' : 'ငွေသွင်းတောင်းဆို'),
    createdBy: actor.username,
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
  };

  db.transactions.unshift(tx);
  await writeDb(db);
  return { transaction: publicTransaction(tx) };
}
