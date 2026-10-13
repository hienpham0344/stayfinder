import { ApiError } from '../services/apiClient';
import type { BookingApi } from '../services/bookingApi';import type{PaymentApi}from'../services/paymentApi';
import type{QuoteSelection}from'../types/catalog';import type{Quote,GuestInformation,CreateBooking,PaymentMethod,BookingDto,PaymentDto}from'../types/transaction';
export type BookingIntent={body:CreateBooking;bookingKey:string;paymentKey:string;bookingId:string|null;paymentId:string|null;uncertain:boolean};
export type SavedDraft={ownerId:string;selection:QuoteSelection|null;guest:GuestInformation|null;quote:Quote|null;intent:BookingIntent|null;benefits?:{voucherId:string|null;rewardPoints:number}};
export type DraftStorage={read():Promise<SavedDraft|null>;write(value:SavedDraft):Promise<void>;clear():Promise<void>};
export type DraftState={ownerId:string|null;selection:QuoteSelection|null;guest:GuestInformation|null;quote:Quote|null;intent:BookingIntent|null;booking:BookingDto|null;payment:PaymentDto|null;busy:boolean;error:string};
const empty=(ownerId:string|null):DraftState=>({ownerId,selection:null,guest:null,quote:null,intent:null,booking:null,payment:null,busy:false,error:''});
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));
let counter=0;
export function mutationKey(prefix:string){return prefix+'.'+Date.now().toString(36)+'.'+(++counter).toString(36)+'.'+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);}
export function confirmationState(b:BookingDto|null,p:PaymentDto|null):'pending'|'property_unpaid'|'paid'|'cancelled'|'completed'{
 if(!b)return'pending';if(b.status==='cancelled')return'cancelled';if(b.status==='completed')return'completed';
 if(b.status!=='confirmed')return'pending';
 if(b.paymentMethod==='pay_at_property'&&b.paymentStatus==='pending')return'property_unpaid';
 return b.paymentStatus==='success'&&p?.status==='success'&&p.bookingId===b.id&&p.method===b.paymentMethod&&b.refundStatus==='none'?'paid':'pending';
}
export function shouldPollBank(b:BookingDto|null,p:PaymentDto|null,now:number,active:boolean){
 return active&&b?.paymentMethod==='bank_transfer'&&b.status==='pending'&&(!p||p.status==='pending')
  &&!!b.holdExpiresAt&&Number.isFinite(Date.parse(b.holdExpiresAt))&&now<Date.parse(b.holdExpiresAt);
}
export class BookingDraftStore{
 private state:DraftState=empty(null);private version=0;private listeners=new Set<()=>void>();private abort:AbortController|null=null;
 private bookings:BookingApi;private payments:PaymentApi;private storage:DraftStorage;private now:()=>number;private benefits={voucherId:null as string|null,rewardPoints:0};
 constructor(bookings:BookingApi,payments:PaymentApi,storage:DraftStorage,now:()=>number=Date.now){this.bookings=bookings;this.payments=payments;this.storage=storage;this.now=now;}
 snapshot(){return clone(this.state);}
 subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn);};}
 private notify(){this.listeners.forEach(fn=>fn());}
 private check(v:number){if(v!==this.version||!this.state.ownerId)throw new ApiError('SESSION_CHANGED',409,'Your session changed. Sign in again.');}
 private async persist(v:number){
  this.check(v);const s=this.state;
  await this.storage.write(clone({ownerId:s.ownerId!,selection:s.selection,guest:s.guest,quote:s.quote,intent:s.intent,benefits:this.benefits}));this.check(v);
 }
 async changeOwner(ownerId:string|null){
  this.version++;this.abort?.abort();this.state=empty(ownerId);this.benefits={voucherId:null,rewardPoints:0};this.notify();
  if(!ownerId){await this.storage.clear();return;}
  const v=this.version,saved=await this.storage.read();this.check(v);
  if(saved?.ownerId===ownerId&&saved.selection&&saved.guest){this.state={...this.state,...clone(saved)};this.benefits=saved.benefits??{voucherId:saved.quote?.voucherId??null,rewardPoints:saved.quote?.rewardPoints??0};this.notify();}
  else if(saved)await this.storage.clear();
 }
 dispose(){this.version++;this.abort?.abort();this.listeners.clear();}
 private editable(){
  if(!this.state.ownerId)throw new ApiError('SESSION_REQUIRED',401,'Sign in to book.');
  if(this.state.busy)throw new ApiError('BUSY',409,'Please wait for the current request.');
  if(this.state.intent?.uncertain)throw new ApiError('RESOLVE_PENDING',409,'Retry the pending request before changing this booking.');
 }
 async setGuest(selection:QuoteSelection,guest:GuestInformation){
  this.editable();this.version++;this.state={...empty(this.state.ownerId),selection:clone(selection),guest:clone(guest)};this.benefits={voucherId:null,rewardPoints:0};this.notify();await this.persist(this.version);
 }
 async setBenefits(voucherId:string|null,rewardPoints:number){
  this.editable();if(voucherId&&rewardPoints>0||!Number.isSafeInteger(rewardPoints)||rewardPoints<0||rewardPoints%100!==0)throw new ApiError('REWARD_INELIGIBLE',422,'Choose either a voucher or whole100-point blocks.');
  if(this.state.intent)throw new ApiError('BOOKING_ALREADY_CREATED',409,'This booking already has fixed terms.');
  this.benefits={voucherId,rewardPoints};this.state.quote=null;this.notify();await this.persist(this.version);
 }
 private async run<T>(work:(v:number,signal:AbortSignal)=>Promise<T>):Promise<T>{
  if(this.state.busy)throw new ApiError('BUSY',409,'Please wait for the current request.');
  if(!this.state.ownerId)throw new ApiError('SESSION_REQUIRED',401,'Sign in to continue.');
  const v=this.version;this.abort=new AbortController();this.state.busy=true;this.state.error='';this.notify();
  try{return await work(v,this.abort.signal);}catch(e){
   if(v===this.version){this.state.error=e instanceof Error?e.message:'Unable to continue. Try again.';this.notify();}throw e;
  }finally{if(v===this.version){this.state.busy=false;this.notify();}}
 }
 refreshQuote(){
  return this.run(async(v,signal)=>{
   if(this.state.intent)throw new ApiError('RESOLVE_PENDING',409,'This booking has a pending or saved request. Resume it first.');
   if(!this.state.selection||!this.state.guest)throw new ApiError('GUEST_REQUIRED',400,'Enter guest information first.');
   const q=await this.bookings.quote({...clone(this.state.selection),...this.benefits},signal);this.check(v);
   this.state.quote=q;await this.persist(v);this.notify();return q;
  });
 }
 checkout(method:PaymentMethod){
  return this.run(async(v,signal)=>{
   if(!this.state.intent){
    const q=this.state.quote,g=this.state.guest;
    if(!q||!g||!Number.isFinite(Date.parse(q.expiresAt))||this.now()>=Date.parse(q.expiresAt))throw new ApiError('QUOTE_EXPIRED',409,'Refresh the quote before booking.');
    this.state.intent={body:{quoteId:q.id,guest:clone(g),paymentMethod:method},bookingKey:mutationKey('booking'),paymentKey:mutationKey('payment'),bookingId:null,paymentId:null,uncertain:false};
    await this.persist(v);
   }
   const intent=this.state.intent!;
   if(intent.body.paymentMethod!==method)throw new ApiError('BOOKING_METHOD_FIXED',409,'Retry the original payment method. Cancel and rebook to change it.');
   try{
    const b=intent.bookingId?await this.bookings.get(intent.bookingId,signal):await this.bookings.create(clone(intent.body),intent.bookingKey,signal);this.check(v);
    intent.bookingId=b.id;intent.uncertain=false;this.state.booking=b;await this.persist(v);this.notify();
    const p=intent.paymentId?await this.payments.get(intent.paymentId,signal):await this.payments.create(b.id,method,intent.paymentKey,signal);this.check(v);
    intent.paymentId=p.id;intent.uncertain=false;this.state.payment=p;await this.persist(v);this.notify();return {booking:b,payment:p};
   }catch(e){
    this.check(v);
    const definitive=new Set(['QUOTE_EXPIRED','QUOTE_CHANGED','QUOTE_ALREADY_USED','ROOM_NOT_AVAILABLE','INSUFFICIENT_POINTS','REWARD_INELIGIBLE','VOUCHER_EXPIRED','VALIDATION_ERROR']);
    const code=(e as{code?:string}).code;
    if(!intent.bookingId&&code&&definitive.has(code)){this.state.intent=null;this.state.quote=null;}
    else intent.uncertain=true;
    await this.persist(v);throw e;
   }
  });
 }
 refreshStatus(){
  return this.run(async(v,signal)=>{
   const i=this.state.intent;if(!i?.bookingId)return null;
   const b=await this.bookings.get(i.bookingId,signal);this.check(v);this.state.booking=b;
   if(i.paymentId){const p=await this.payments.get(i.paymentId,signal);this.check(v);this.state.payment=p;}
   this.notify();return this.state.booking;
  });
 }
 resume(id:string){
  return this.run(async(v,signal)=>{
   if(this.state.intent?.uncertain&&this.state.intent.bookingId!==id)throw new ApiError('RESOLVE_PENDING',409,'Resolve the pending booking request first.');
   const b=await this.bookings.get(id,signal);this.check(v);const list=await this.payments.list(id,signal);this.check(v);
   this.state.selection={accommodationId:b.accommodationId,roomId:b.roomId,checkIn:b.checkIn,checkOut:b.checkOut,quantity:b.quantity,adults:b.adults,children:b.children};
   this.state.guest=b.guest;this.state.quote=b.quote;this.state.booking=b;this.state.payment=list[0]??null;
   this.state.intent={body:{quoteId:b.quote.id,guest:clone(b.guest),paymentMethod:b.paymentMethod},bookingKey:mutationKey('resume'),paymentKey:mutationKey('payment'),bookingId:id,paymentId:list[0]?.id??null,uncertain:false};
   await this.persist(v);this.notify();return b;
  });
 }
}
