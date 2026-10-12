import test from 'node:test';
import assert from 'node:assert/strict';
import { toStayCard, toStayDetail, toRoomTier, formatUsd } from './dtoAdapters.ts';
const id='26c03020-23c5-47c5-aa78-af7359976d36';
const card={id,name:'Test stay',typeId:id,typeName:'Hotel',city:null,address:null,latitude:null,longitude:null,nightlyPrice:{amountCents:29900,currency:'USD'},coverImageUrl:null,ratingAverage:null,reviewCount:0,isFavorite:false};
test('USD cents are displayed exactly without legacy VND scaling',()=>{
  assert.equal(formatUsd(card.nightlyPrice),'$299.00');
  assert.equal(formatUsd({amountCents:9,currency:'USD'}),'$0.09');
  assert.equal(toStayCard(card).id,id);
});
test('cards preserve unknown facts and do not fabricate detail or fixture images',()=>{
  const model=toStayCard(card);
  assert.equal(model.rating,null);
  assert.equal(model.imageUrl,null);
  assert.equal(model.locationLabel,null);
  assert.equal(model.coordinates,null);
  assert.equal('host' in model,false);
  assert.equal('stockTotal' in model,false);
});
test('detail exposes only supplied nullable host and property facts',()=>{
  const model=toStayDetail({...card,description:null,timezone:'Asia/Bangkok',imageUrls:[],amenities:[],cleaningFee:{amountCents:0,currency:'USD'},serviceFee:{amountCents:100,currency:'USD'},bedrooms:null,beds:null,baths:null,host:null});
  assert.equal(model.host,null); assert.equal(model.beds,null); assert.deepEqual(model.images,[]);
  assert.equal(model.serviceFee.amountCents,100);
});
test('room IDs stock and nullable breakfast survive adaptation',()=>{
  const model=toRoomTier({id,accommodationId:id,name:'Suite',description:null,nightlyPrice:card.nightlyPrice,sizeSqm:null,bedType:null,maxGuestsPerRoom:3,stockTotal:2,availableCount:1,includesBreakfast:null,imageUrls:[],cancellationPolicy:{freeBeforeCheckIn:true,checkInLocalTime:'14:00',timezone:'Asia/Bangkok'}});
  assert.equal(model.id,id); assert.equal(model.availableCount,1); assert.equal(model.includesBreakfast,null);
  assert.equal(model.sizeSqm,null); assert.equal(model.nightlyPrice.amountCents,29900);
});
test('non-USD or unsafe money cannot be shown as a USD price',()=>{
  assert.throws(()=>formatUsd({amountCents:1,currency:'VND'}));
  assert.throws(()=>formatUsd({amountCents:2.5,currency:'USD'}));
});
