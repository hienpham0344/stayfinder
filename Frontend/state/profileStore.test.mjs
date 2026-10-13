import test from'node:test';import assert from'node:assert/strict';import{registerHooks}from'node:module';
registerHooks({resolve(s,c,n){try{return n(s,c);}catch(e){if(e.code==='ERR_MODULE_NOT_FOUND'&&/^\.{1,2}\//.test(s)&&!/\.[a-z]+$/i.test(s))return n(s+'.ts',c);throw e;}}});
const{ProfileStore}=await import('./profileStore.ts');
const profile={id:'u1',fullName:'Synthetic',email:'synthetic@example.test',phone:null,avatarUrl:null,role:'customer',loyaltyPoints:0,loyaltyTier:0};
const prefs={language:'en-US',bookingNotifications:true};
test('profile logout clears previous user and late response stays hidden',async()=>{
 let done;const s=new ProfileStore({get:()=>new Promise(r=>done=r),preferences:async()=>prefs});
 s.changeOwner('u1');const p=s.load();s.changeOwner(null);done(profile);await p;assert.equal(s.snapshot().profile,null);
});
test('failed profile or preference update preserves persisted values',async()=>{
 const s=new ProfileStore({get:async()=>profile,preferences:async()=>prefs,patch:async()=>{throw new Error('Offline');},patchPreferences:async()=>{throw new Error('Offline');}});
 s.changeOwner('u1');await s.load();await assert.rejects(s.save({fullName:'Changed'}));assert.equal(s.snapshot().profile.fullName,'Synthetic');
 await assert.rejects(s.savePreferences({language:'vi-VN'}));assert.equal(s.snapshot().preferences.language,'en-US');
});
test('uncertain support report retries with same body and key; changed body is refused',async()=>{
 const calls=[];let fail=true;const s=new ProfileStore({report:async(body,key)=>{calls.push({body,key});if(fail){fail=false;throw new Error('Offline');}return{reportId:'r1',status:'submitted'};}});
 s.changeOwner('u1');const body={category:'Payment',description:'Synthetic issue',bookingId:null};
 await assert.rejects(s.report(body));await assert.rejects(s.report({...body,description:'Different'}));const result=await s.report(body);
 assert.equal(result.reportId,'r1');assert.deepEqual(calls[0],calls[1]);assert.equal(s.snapshot().pendingReport,null);
});
