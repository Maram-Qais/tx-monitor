export type Currency = "USD" | "EUR" | "IQD" | "GBP";
export type TxStatus = "pending" | "processing" | "completed" | "failed";

export interface Party {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  timestamp: Date;
  amount: number;
  currency: Currency;
  sender: Party;
  receiver: Party;
  status: TxStatus;
  riskScore: number; 
  flagged: boolean;
}
