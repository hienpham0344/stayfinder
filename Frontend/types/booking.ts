import { Stay } from './stay';

export interface Booking {
  id: string;
  stayId: string;
  stay: Stay;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  guestsCount: number;
  totalAmount: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  paymentMethod: 'CreditCard' | 'MOMO' | 'VNPay' | 'Cash';
  createdAt: string;
}
