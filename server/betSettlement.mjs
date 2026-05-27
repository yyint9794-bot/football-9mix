import crypto from 'node:crypto';

export function normalizeDb(db) {
  if (!Array.isArray(db.bets)) {
    db.bets = [];
  }
  return db;
}

export function parseMultiplier(oddsLabel) {
  const raw = String(oddsLabel || '').replace(/[^\d.+-]/g, '');
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return 1.9;
  }
  return value >= 1 ? value : 1 + value;
}

export function evaluatePick(pick, homeScore, awayScore) {
  const home = Number(homeScore) || 0;
  const away = Number(awayScore) || 0;
  const total = home + away;

  if (pick.side === 'body-home') {
    return home > away;
  }
  if (pick.side === 'body-away') {
    return away > home;
  }

  const line = Number(pick.goalLine);
  const goalLine = Number.isFinite(line) ? line : 2.5;

  if (pick.side === 'goal-over') {
    return total > goalLine;
  }
  if (pick.side === 'goal-under') {
    return total < goalLine;
  }

  return false;
}

function newTxId() {
  return `tx_${crypto.randomBytes(8).toString('hex')}`;
}

export function settleUserBets(db, userId, matchResults) {
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) {
    return { credited: 0, settled: 0 };
  }

  let credited = 0;
  let settled = 0;
  const pending = db.bets.filter((bet) => bet.userId === userId && bet.status === 'pending');

  for (const bet of pending) {
    const outcomes = bet.picks.map((pick) => {
      const match = matchResults.find((entry) => String(entry.matchId) === String(pick.matchId));
      if (!match || !match.finished) {
        return null;
      }
      return evaluatePick(pick, match.homeScore, match.awayScore);
    });

    if (outcomes.some((result) => result === null)) {
      continue;
    }

    const won = outcomes.every(Boolean);
    bet.settledAt = new Date().toISOString();

    if (won) {
      const payout = Math.round(bet.stake * bet.payoutMultiplier);
      bet.status = 'won';
      bet.payout = payout;
      user.balance += payout;
      credited += payout;
      db.transactions.unshift({
        id: newTxId(),
        userId: user.id,
        username: user.username,
        type: 'deposit',
        amount: payout,
        status: 'completed',
        note: `လောင်းကြေး နိုင်ပွဲ — ${bet.type === 'maung' ? 'မောင်း' : 'ဘော်ဒီ'} (${bet.id})`,
        createdBy: 'system',
        createdAt: bet.settledAt,
        reviewedAt: bet.settledAt,
        reviewedBy: 'system',
      });
    } else {
      bet.status = 'lost';
      bet.payout = 0;
    }

    settled += 1;
  }

  return { credited, settled };
}
