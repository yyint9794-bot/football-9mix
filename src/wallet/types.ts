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
