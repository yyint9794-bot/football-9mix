import crypto from 'node:crypto';

const DB_KEY = 'wallet-db';

let readDbFn = null;
let writeDbFn = null;

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function buildSeedDb() {
  const adminUser = process.env.WALLET_ADMIN_USER || 'admin';
  const adminPass = process.env.WALLET_ADMIN_PASS || 'admin123';
  return {
    users: [
      {
        id: newId('user'),
        username: adminUser,
        passwordHash: hashPassword(adminPass),
        role: 'admin',
        balance: 0,
        active: true,
        displayName: 'Admin',
        createdAt: new Date().toISOString(),
      },
    ],
    transactions: [],
    sessions: {},
  };
}

function createKvAdapter(kv) {
  return {
    async read() {
      const raw = await kv.get(DB_KEY);
      if (!raw) {
        const seed = buildSeedDb();
        await kv.put(DB_KEY, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(raw);
    },
    async write(db) {
      await kv.put(DB_KEY, JSON.stringify(db));
    },
  };
}

function createFileAdapter() {
  return {
    async read() {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const dbPath = process.env.WALLET_DB_PATH || path.join(process.cwd(), 'data', 'wallet-db.json');

      try {
        await fs.access(dbPath);
      } catch {
        const seed = buildSeedDb();
        await fs.mkdir(path.dirname(dbPath), { recursive: true });
        await fs.writeFile(dbPath, JSON.stringify(seed, null, 2), 'utf8');
      }

      const raw = await fs.readFile(dbPath, 'utf8');
      return JSON.parse(raw);
    },
    async write(db) {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const dbPath = process.env.WALLET_DB_PATH || path.join(process.cwd(), 'data', 'wallet-db.json');
      await fs.mkdir(path.dirname(dbPath), { recursive: true });
      await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8');
    },
  };
}

/** Local dev and Node API handlers (file-backed JSON). */
export function useFileWalletStorage() {
  const adapter = createFileAdapter();
  readDbFn = adapter.read;
  writeDbFn = adapter.write;
}

/** Cloudflare Pages / Workers (KV-backed JSON). */
export function useKvWalletStorage(kv) {
  if (!kv) {
    throw new Error('WALLET_KV binding is missing');
  }
  const adapter = createKvAdapter(kv);
  readDbFn = adapter.read;
  writeDbFn = adapter.write;
}

export async function readDb() {
  if (!readDbFn) {
    useFileWalletStorage();
  }
  return readDbFn();
}

export async function writeDb(db) {
  if (!writeDbFn) {
    useFileWalletStorage();
  }
  return writeDbFn(db);
}
