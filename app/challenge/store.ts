export type ChallengeOrder = {
  id: string;
  type: "challenge_fee";
  level: string;
  amountUsd: number;
  asset: "SOL" | "BTC";
  walletAddress: string;
  status: "pending" | "confirmed" | "expired" | "failed";
  createdAt: number;
  txHash: string | null;
  challengeActivated: boolean;
  confirmedAt?: number | null;
  userId?: string | null;
};