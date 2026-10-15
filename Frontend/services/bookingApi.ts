import type { ApiClient } from './apiClient';
import type { QuoteRequest,Quote,CreateBooking,BookingDto,BookingPage,CancellationPreview } from '../types/transaction';
export function createBookingApi(api:ApiClient){
 return{
  quote:(body:QuoteRequest,signal?:AbortSignal)=>api.request<Quote>('/booking-quotes',{method:'POST',body,signal}),
  create:(body:CreateBooking,key:string,signal?:AbortSignal)=>api.request<BookingDto>('/bookings',{method:'POST',body,idempotencyKey:key,signal}),
  get:(id:string,signal?:AbortSignal)=>api.request<BookingDto>('/bookings/'+encodeURIComponent(id),{signal}),
  list:(page=0,status?:string,signal?:AbortSignal)=>api.request<BookingPage>('/bookings?'+new URLSearchParams({page:String(page),size:'20',...(status?{status}:{})}),{signal}),
  previewCancellation:(id:string,signal?:AbortSignal)=>api.request<CancellationPreview>('/bookings/'+encodeURIComponent(id)+'/cancellation-preview',{signal}),
  cancel:(id:string,reason:string|null,key:string,signal?:AbortSignal)=>api.request<BookingDto>('/bookings/'+encodeURIComponent(id)+'/cancel',{method:'POST',body:{reason},idempotencyKey:key,signal}),
 };
}
export type BookingApi=ReturnType<typeof createBookingApi>;
