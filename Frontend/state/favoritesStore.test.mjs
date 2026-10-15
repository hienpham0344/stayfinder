import test from 'node:test';
import assert from 'node:assert/strict';
import { FavoritesStore } from './favoritesStore.ts';
const card={id:'stay-id',title:'Stay',nightlyPrice:{amountCents:29900,currency:'USD'},isFavorite:true};
const page=(items)=>({items:items.map(stay=>({favoriteId:'fav-id',stay})),page:0,size:20,totalElements:items.length,totalPages:1});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject};};
test('failed optimistic removal restores the saved stay and reconciles with server',async()=>{
 const api={list:async()=>page([card]),add:async()=>{},remove:async()=>{throw new Error('Offline');}};
 const store=new FavoritesStore(api);store.changeOwner('user-a');await store.load();
 const pending=store.toggle(card);assert.equal(store.isSaved(card.id,true),false);
 await pending;assert.equal(store.isSaved(card.id,true),true);assert.equal(store.snapshot().items.length,1);assert.ok(store.snapshot().error);
});
test('account change drops an in-flight old account list',async()=>{
 const d=deferred();const store=new FavoritesStore({list:()=>d.promise,add:async()=>{},remove:async()=>{}});
 store.changeOwner('user-a');const pending=store.load();store.changeOwner('user-b');
 d.resolve(page([card]));await pending;assert.deepEqual(store.snapshot().items,[]);
 assert.equal(store.isSaved(card.id,false),false);
});
test('reconciling one save keeps another pending optimistic save visible',async()=>{
 const d=deferred(),second={...card,id:'second-id',isFavorite:false};
 const api={list:async()=>page([{...card,isFavorite:true}]),add:id=>id===second.id?d.promise:Promise.resolve({}),remove:async()=>{}};
 const store=new FavoritesStore(api);store.changeOwner('user-a');
 const secondPending=store.toggle(second);
 await store.toggle({...card,isFavorite:false});
 assert.ok(store.snapshot().items.some(s=>s.id===second.id));
 d.resolve({});await secondPending;
});
test('a pending write cannot alter another account after switch',async()=>{
 const d=deferred();const store=new FavoritesStore({list:async()=>page([]),add:()=>d.promise,remove:async()=>{}});
 store.changeOwner('user-a');const pending=store.toggle({...card,isFavorite:false});
 store.changeOwner('user-b');d.resolve({});await pending;
 assert.equal(store.isSaved(card.id,false),false);assert.equal(store.snapshot().error,'');
});
