export type WalletUser = {
  id: string;
  username: string;
  role: 'admin' | 'user';
  balance: number;
  active: boolean;
  displayName: string;
  createdAt: string;
  termsAccepted: boolean;
};

export type WalletBetPick = {
  matchId: string;
  league: string;
  homeName: string;
  awayName: string;
  side: string;
  oddsLabel: string;
  summary: string;
  goalLine?: number;
};

export type WalletBet = {
  id: string;
  userId: string;
  type: 'maung' | 'body';
  stake: number;
  payoutMultiplier: number;
  picks: WalletBetPick[];
  status: 'pending' | 'won' | 'lost';
  payout: number;
  createdAt: string;
  settledAt: string | null;
};

export type WalletTransaction = {
  id: string;
  userId: string;
  username: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  note: string;
  createdBy: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};
