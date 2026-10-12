import test from 'node:test';
import assert from 'node:assert/strict';
import { emptySearchSelection, applySearchSelection, cancelSearchSelection, validateSearchSelection, SearchRequestSequencer, selectionForRoom, parseUsdCents } from './searchSelection.ts';
test('cancel restores the last applied query with independent arrays',()=>{
 const applied=applySearchSelection({...emptySearchSelection(),q:'Bali',typeIds:['real-uuid']});
 const draft=cancelSearchSelection(applied); draft.q='Paris';draft.typeIds.push('other');
 const cancelled=cancelSearchSelection(applied);
 assert.equal(cancelled.q,'Bali');assert.deepEqual(cancelled.typeIds,['real-uuid']);
});
test('a late older response cannot replace newer results',()=>{
 const s=new SearchRequestSequencer();const first=s.next();const second=s.next();
 assert.equal(s.accept(first),false); assert.equal(s.accept(second),true);
 s.invalidate();assert.equal(s.accept(second),false);
});
test('no fixture date fallback; room quantity is explicit in QuoteSelection',()=>{
 const initial=emptySearchSelection();assert.equal(initial.checkIn,'');assert.equal(initial.checkOut,'');
 assert.throws(()=>selectionForRoom(initial,'stay-uuid','room-uuid'));
 const query={...initial,checkIn:'2026-11-01',checkOut:'2026-11-03',rooms:2,adults:3,children:1};
 assert.deepEqual(selectionForRoom(query,'stay-uuid','room-uuid'),{accommodationId:'stay-uuid',roomId:'room-uuid',checkIn:'2026-11-01',checkOut:'2026-11-03',quantity:2,adults:3,children:1});
});
test('date pairs impossible dates capacity limits and cent input are checked',()=>{
 assert.ok(validateSearchSelection({...emptySearchSelection(),checkIn:'2026-11-01'}));
 assert.ok(validateSearchSelection({...emptySearchSelection(),checkIn:'2026-02-30',checkOut:'2026-03-02'}));
 assert.ok(validateSearchSelection({...emptySearchSelection(),rooms:0}));
 assert.equal(validateSearchSelection(emptySearchSelection()),'');
 assert.equal(parseUsdCents('299.09'),29909);assert.equal(parseUsdCents(''),undefined);
 assert.throws(()=>parseUsdCents('1.001')); assert.throws(()=>parseUsdCents('-1'));
});
