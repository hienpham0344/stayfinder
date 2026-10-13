import test from 'node:test';import assert from 'node:assert/strict';import { registerHooks } from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(e){if(e.code==='ERR_MODULE_NOT_FOUND'&&/^\.{1,2}\//.test(specifier)&&!/\.[a-z]+$/i.test(specifier))return next(specifier+'.ts',context);throw e;}}});
const {BookingDraftStore}=await import('./bookingDraft.ts');
const selection={accommodationId:'stay',roomId:'room',checkIn:'2026-11-01',checkOut:'2026-11-04',quantity:1,adults:1,children:0};
const guest={fullName:'Synthetic guest',email:'guest@example.test',phone:'+84912345678',specialRequest:null};
const quote={id:'quote',...selection,voucherId:null,rewardPoints:0,expiresAt:'2026-10-13T12:10:00Z',total:{amountCents:103200,currency:'USD'}};
function fixture(){
 let saved=null;const calls=[];let fail=true;const now=()=>Date.parse('2026-10-13T12:00:00Z');
 const storage={read:async()=>saved,write:async value=>{saved=JSON.parse(JSON.stringify(value));},clear:async()=>{saved=null;}};
 const bookings={quote:async()=>quote,create:async(body,key)=>{calls.push({body:structuredClone(body),key});if(fail){fail=false;throw Object.assign(new Error('Synthetic network error'),{code:'NETWORK_ERROR',status:0});}return{id:'book',...selection,status:'pending',paymentMethod:body.paymentMethod,paymentStatus:'pending',refundStatus:'none',quote,guest};},
 get:async id=>({id,...selection,status:'pending',paymentMethod:'bank_transfer',paymentStatus:'pending',refundStatus:'none',quote,guest})};
 const payments={create:async(id,method,key)=>({id:'payment',bookingId:id,method,status:'pending',originalAmount:quote.total}),get:async()=>null};
 return{storage,bookings,payments,calls,now,getSaved:()=>saved};
}
test('uncertain booking retry retains body and key and cannot switch method',async()=>{
 const f=fixture();const store=new BookingDraftStore(f.bookings,f.payments,f.storage,f.now);
 await store.changeOwner('owner');await store.setGuest(selection,guest);await store.refreshQuote();
 await assert.rejects(store.checkout('bank_transfer'));
 const key=store.snapshot().intent.bookingKey;assert.ok(key);
 await assert.rejects(store.checkout('pay_at_property'));
 await store.checkout('bank_transfer');assert.equal(f.calls.length,2);assert.deepEqual(f.calls[0],f.calls[1]);assert.equal(store.snapshot().booking.id,'book');
});
test('reload can recover an uncertain intent without creating a new quote or key',async()=>{
 const f=fixture();let store=new BookingDraftStore(f.bookings,f.payments,f.storage,f.now);
 await store.changeOwner('owner');await store.setGuest(selection,guest);await store.refreshQuote();await assert.rejects(store.checkout('bank_transfer'));
 const key=store.snapshot().intent.bookingKey;store.dispose();
 store=new BookingDraftStore(f.bookings,f.payments,f.storage,f.now);await store.changeOwner('owner');await store.checkout('bank_transfer');
 assert.equal(f.calls[1].key,key);assert.equal(store.snapshot().booking.id,'book');
});
test('expired quote cannot create a booking',async()=>{
 const f=fixture();f.bookings.quote=async()=>({...quote,expiresAt:'2026-10-13T11:59:59Z'});
 const store=new BookingDraftStore(f.bookings,f.payments,f.storage,f.now);await store.changeOwner('owner');await store.setGuest(selection,guest);await store.refreshQuote();
 await assert.rejects(store.checkout('bank_transfer'));assert.equal(f.calls.length,0);
});
test('logout erases private draft and late response cannot republish the old owner',async()=>{
 const f=fixture();let resolve;f.bookings.quote=()=>new Promise(r=>{resolve=r;});
 const store=new BookingDraftStore(f.bookings,f.payments,f.storage,f.now);await store.changeOwner('owner');await store.setGuest(selection,guest);
 const pending=store.refreshQuote();await store.changeOwner(null);resolve(quote);await assert.rejects(pending);
 assert.equal(store.snapshot().ownerId,null);assert.equal(store.snapshot().quote,null);assert.equal(f.getSaved(),null);
});

test('restored discounted draft requotes with the same selected benefit',async()=>{
 const f=fixture();let captured;f.bookings.quote=async body=>{captured=body;return{...quote,rewardPoints:1000,discountSource:'points'};};
 let store=new BookingDraftStore(f.bookings,f.payments,f.storage,f.now);await store.changeOwner('owner');await store.setGuest(selection,guest);await store.setBenefits(null,1000);await store.refreshQuote();store.dispose();
 store=new BookingDraftStore(f.bookings,f.payments,f.storage,f.now);await store.changeOwner('owner');await store.refreshQuote();assert.equal(captured.rewardPoints,1000);
});
test('definitive stale quote rejection clears the retry intent and requires a fresh quote',async()=>{
 const f=fixture();f.bookings.create=async()=>{throw Object.assign(new Error('Price changed'),{code:'QUOTE_CHANGED',status:409});};
 const store=new BookingDraftStore(f.bookings,f.payments,f.storage,f.now);await store.changeOwner('owner');await store.setGuest(selection,guest);await store.refreshQuote();await assert.rejects(store.checkout('bank_transfer'));assert.equal(store.snapshot().intent,null);assert.equal(store.snapshot().quote,null);
});

