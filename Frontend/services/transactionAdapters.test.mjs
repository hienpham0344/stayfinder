import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(e){if(e.code==='ERR_MODULE_NOT_FOUND'&&/^\.{1,2}\//.test(specifier)&&!/\.[a-z]+$/i.test(specifier))return next(specifier+'.ts',context);throw e;}}});
const {createBookingApi}=await import('./bookingApi.ts');
const {createPaymentApi}=await import('./paymentApi.ts');
const {confirmationState,shouldPollBank}=await import('../state/bookingDraft.ts');
test('booking create sends only quote guest method and preserves the exact key',async()=>{
 let request;const api=createBookingApi({request:async(path,options)=>{request={path,options};return{id:'b'};}});
 const guest={fullName:'Nguyễn Minh Anh',email:'guest@example.test',phone:'+84912345678',specialRequest:null};
 await api.create({quoteId:'q',guest,paymentMethod:'bank_transfer'},'stable-key');
 assert.equal(request.path,'/bookings');assert.deepEqual(request.options.body,{quoteId:'q',guest,paymentMethod:'bank_transfer'});
 assert.equal(request.options.idempotencyKey,'stable-key');assert.equal('amount' in request.options.body,false);
});
test('payment metadata is public and payment mutation uses immutable method only',async()=>{
 const calls=[];const api=createPaymentApi({request:async(path,options)=>{calls.push({path,options});return {};}});
 await api.methods();await api.create('booking-id','pay_at_property','payment-key');
 assert.equal(calls[0].options.auth,false);assert.equal(calls[1].path,'/bookings/booking-id/payments');
 assert.deepEqual(calls[1].options.body,{method:'pay_at_property'});assert.equal(calls[1].options.idempotencyKey,'payment-key');
});
const base={id:'b',status:'pending',paymentMethod:'bank_transfer',paymentStatus:'pending',refundStatus:'none',holdExpiresAt:'2026-10-13T12:15:00Z'};
test('countdown expiry never manufactures success; bank needs both server states',()=>{
 assert.equal(confirmationState(base,{status:'pending',method:'bank_transfer'}),'pending');
 assert.equal(confirmationState({...base,status:'confirmed',paymentStatus:'success'},{status:'pending',method:'bank_transfer'}),'pending');
 assert.equal(confirmationState({...base,status:'confirmed',paymentStatus:'success'},{bookingId:'b',status:'success',method:'bank_transfer'}),'paid');
 assert.equal(shouldPollBank(base,{status:'pending',method:'bank_transfer',expiresAt:base.holdExpiresAt},Date.parse(base.holdExpiresAt),true),false);
 assert.equal(shouldPollBank(base,{status:'pending',method:'bank_transfer',expiresAt:base.holdExpiresAt},Date.parse('2026-10-13T12:00:00Z'),false),false);
});
test('property confirmation is explicitly unpaid and cancelled/refunded cannot appear paid',()=>{
 assert.equal(confirmationState({...base,status:'confirmed',paymentMethod:'pay_at_property'},null),'property_unpaid');
 assert.equal(confirmationState({...base,status:'cancelled',paymentStatus:'success',refundStatus:'requested'},{status:'success'}),'cancelled');
});

test('a successful payment belonging to another booking cannot confirm this booking',()=>{
 assert.equal(confirmationState({...base,status:'confirmed',paymentStatus:'success'},{bookingId:'other',method:'bank_transfer',status:'success'}),'pending');
});

