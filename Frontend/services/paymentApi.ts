import type {ApiClient} from './apiClient';import type{PaymentDto,PaymentMethod,PaymentMethodOption}from'../types/transaction';
export function createPaymentApi(api:ApiClient){return{
 methods:(signal?:AbortSignal)=>api.request<PaymentMethodOption[]>('/payment-methods',{auth:false,signal}),
 create:(id:string,method:PaymentMethod,key:string,signal?:AbortSignal)=>api.request<PaymentDto>('/bookings/'+encodeURIComponent(id)+'/payments',{method:'POST',body:{method},idempotencyKey:key,signal}),
 get:(id:string,signal?:AbortSignal)=>api.request<PaymentDto>('/payments/'+encodeURIComponent(id)+'/status',{signal}),
 list:(bookingId:string,signal?:AbortSignal)=>api.request<PaymentDto[]>('/bookings/'+encodeURIComponent(bookingId)+'/payments',{signal}),
};}export type PaymentApi=ReturnType<typeof createPaymentApi>;
