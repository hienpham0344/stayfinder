import test from 'node:test';import assert from 'node:assert/strict';import{registerHooks}from'node:module';
registerHooks({resolve(s,c,n){try{return n(s,c);}catch(e){if(e.code==='ERR_MODULE_NOT_FOUND'&&/^\.{1,2}\//.test(s)&&!/\.[a-z]+$/i.test(s))return n(s+'.ts',c);throw e;}}});
const {NotificationsStore}=await import('./notificationsStore.ts');
const item={id:'n1',type:'booking.confirmed',title:'Confirmed',body:'Saved',createdAt:'2026-10-13T12:00:00Z',readAt:null,target:{route:'booking',resourceId:'b1'}};
const cutoff='2026-10-13T12:00:00.123456Z';
const page={items:[item],page:0,size:20,totalPages:1,totalElements:1,snapshotTime:cutoff};
test('read-all sends original server cutoff and uses authoritative unread result',async()=>{
 let sent;const api={list:async()=>page,count:async()=>({count:3}),readAll:async(time,key)=>{sent={time,key};return{updated:1,unreadCount:2};}};
 const s=new NotificationsStore(api);s.changeOwner('u1');await s.load();await s.markAllRead();
 assert.equal(sent.time,cutoff);assert.ok(sent.key);assert.equal(s.snapshot().unreadCount,2);assert.ok(s.snapshot().items[0].readAt);
});
test('logout clears inbox and late response cannot publish previous owner',async()=>{
 let done;const s=new NotificationsStore({list:()=>new Promise(r=>done=r),count:async()=>({count:5})});
 s.changeOwner('u1');const pending=s.load();s.changeOwner(null);done(page);await pending;
 assert.deepEqual(s.snapshot().items,[]);assert.equal(s.snapshot().unreadCount,0);
});
test('failed read preserves unread item and records actionable error',async()=>{
 const s=new NotificationsStore({list:async()=>page,count:async()=>({count:1}),read:async()=>{throw new Error('Network unavailable');}});
 s.changeOwner('u1');await s.load();await assert.rejects(s.markRead('n1'));
 assert.equal(s.snapshot().items[0].readAt,null);assert.equal(s.snapshot().unreadCount,1);assert.match(s.snapshot().error,/Network/);
});
test('late count before read-all cannot overwrite the newer authoritative count',async()=>{
 let finish;let delayed=false;
 const s=new NotificationsStore({list:async()=>page,count:()=>delayed?new Promise(r=>finish=r):Promise.resolve({count:3}),readAll:async()=>({updated:1,unreadCount:2})});
 s.changeOwner('u1');await s.load();delayed=true;const old=s.refreshCount();await s.markAllRead();finish({count:3});await old;assert.equal(s.snapshot().unreadCount,2);
});

test('read-all preserves a later microsecond delivery even during a concurrent page refresh',async()=>{
 let listReply,readReply,second=false;const late={...item,id:'late',createdAt:'2026-10-13T12:00:00.123457Z'};
 const api={list:()=>second?new Promise(r=>listReply=r):Promise.resolve(page),count:async()=>({count:2}),readAll:()=>new Promise(r=>readReply=r)};
 const s=new NotificationsStore(api);s.changeOwner('u1');await s.load();second=true;
 const refresh=s.load(),read=s.markAllRead();listReply({...page,items:[late,item],snapshotTime:late.createdAt});await refresh;readReply({updated:1,unreadCount:1});await read;
 assert.equal(s.snapshot().items.find(n=>n.id==='late').readAt,null);assert.ok(s.snapshot().items.find(n=>n.id==='n1').readAt);assert.equal(s.snapshot().unreadCount,1);
});
