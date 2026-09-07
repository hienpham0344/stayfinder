export interface RewardVoucher {
  id: string;
  title: string;
  code: string;
  discountPercentage?: number;
  discountAmount?: number;
  minSpend: number;
  expiryDate: string;
  pointsRequired: number;
  isUnlocked: boolean;
  category: 'Discount' | 'FreeBreakfast' | 'RoomUpgrade';
}

export interface MemberTier {
  name: 'Silver' | 'Gold' | 'VIP';
  currentPoints: number;
  nextTierPoints: number;
  benefits: string[];
}
