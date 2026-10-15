import test from'node:test';import assert from'node:assert/strict';import{registerHooks}from'node:module';
registerHooks({resolve(s,c,n){try{return n(s,c);}catch(e){if(e.code==='ERR_MODULE_NOT_FOUND'&&/^\.{1,2}\//.test(s)&&!/\.[a-z]+$/i.test(s))return n(s+'.ts',c);throw e;}}});
const{ReviewEditor}=await import('./reviewEditor.ts');
const id='11111111-1111-4111-8111-111111111111';const url='/api/media/'+id+'/content?expires=1791870000&signature='+'a'.repeat(64);
test('new review sends actual booking/stay and only confirmed upload ids',async()=>{
 let sent;const e=new ReviewEditor({create:async(stay,body)=>{sent={stay,body};return{id:'review'};}},{pick:async()=>({uri:'local',name:'review.png',mimeType:'image/png'}),upload:async()=>({id,displayUrl:url})},{delete:async()=>{}});
 e.start('owner',{stayId:'stay-id',bookingId:'booking-id'});e.setText(4,'Actual experience');await e.addPhoto();await e.submit();assert.deepEqual(sent,{stay:'stay-id',body:{bookingId:'booking-id',rating:4,comment:'Actual experience',mediaIds:[id]}});
});
test('cancelled selection and failed upload never add photo; late old owner response stays hidden',async()=>{
 let resolve;const port={pick:async()=>null,upload:()=>new Promise(r=>resolve=r)};
 const e=new ReviewEditor({},port,{delete:async()=>{}});e.start('owner',{stayId:'s',bookingId:'b'});await e.addPhoto();assert.deepEqual(e.snapshot().photos,[]);
 port.pick=async()=>({uri:'local',name:'review.png',mimeType:'image/png'});port.upload=async()=>{throw new Error('Upload failed');};
 await assert.rejects(e.addPhoto());assert.deepEqual(e.snapshot().photos,[]);
 port.upload=()=>new Promise(r=>resolve=r);const pending=e.addPhoto();await new Promise(r=>setImmediate(r));e.clear();resolve({id,displayUrl:url});await assert.rejects(pending);assert.deepEqual(e.snapshot().photos,[]);
});
test('editing retains existing owned photo ids and does not delete attached photo on removal',async()=>{
 let sent,deleted=0;
 const e=new ReviewEditor({patch:async(review,body)=>{sent={review,body};return{id:review};}},{},{delete:async()=>deleted++});
 e.start('owner',{stayId:'s',review:{id:'r',rating:3,comment:'Before',imageUrls:[url],isMine:true}});
 await e.removePhoto(id);assert.equal(deleted,0);e.setText(5,'Edited');await e.submit();assert.deepEqual(sent,{review:'r',body:{rating:5,comment:'Edited',mediaIds:[]}});
});
