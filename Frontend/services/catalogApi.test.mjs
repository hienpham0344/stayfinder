import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
// Metro resolves extensionless TypeScript imports; native Node tests require
// the extension. This hook changes only that resolution, not source behavior.
registerHooks({ resolve(specifier, context, nextResolve) {
 try { return nextResolve(specifier, context); }
 catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND' && /^\.{1,2}\//.test(specifier) && !/\.[a-z]+$/i.test(specifier)) return nextResolve(specifier + '.ts', context);
  throw error;
 }
}});
const { createCatalogApi } = await import('./catalogApi.ts');
const { createFavoritesApi } = await import('./favoritesApi.ts');
import { emptySearchSelection } from '../state/searchSelection.ts';
test('catalog shares the existing /api base URL without doubling its path',async()=>{
 const { ApiClient } = await import('./apiClient.ts');const paths=[];
 const client=new ApiClient({baseUrl:'https://api.example/api',platform:'web',fetch:async(url)=>{
  paths.push(url);return new Response(JSON.stringify({code:'SUCCESS',result:{items:[],page:0,size:20,totalElements:0,totalPages:0}}));
 }});
 await createCatalogApi(client,()=>false).search(emptySearchSelection());
 assert.equal(new URL(paths[0]).pathname,'/api/accommodations');
});
test('search sends backend selectors and cents, omitting UI-only labels and blank dates',async()=>{
 let request;const api=createCatalogApi({request:async(path,options)=>{request={path,options};return{items:[],page:0,size:20,totalElements:0,totalPages:0};}},()=>false);
 await api.search({...emptySearchSelection(),typeIds:['uuid-a','uuid-b'],amenityIds:['amenity-id'],minPriceCents:0,maxPriceCents:29900,locationId:'location-id',locationLabel:'Display only'},2);
 const q=new URL('https://test.invalid'+request.path).searchParams;
 assert.equal(q.get('typeIds'),'uuid-a,uuid-b');assert.equal(q.get('maxPriceCents'),'29900');assert.equal(q.get('minPriceCents'),'0');
 assert.equal(q.has('locationLabel'),false);assert.equal(q.has('checkIn'),false);assert.equal(q.get('page'),'2');assert.equal(request.options.auth,false);
});
test('favorites consumes the approved accommodation card and shares the /api base',async()=>{
 const { ApiClient } = await import('./apiClient.ts');const paths=[];
 const dto={id:'stay-id',name:'Stay',typeId:'type-id',typeName:'Hotel',city:null,address:null,latitude:null,longitude:null,nightlyPrice:{amountCents:29900,currency:'USD'},coverImageUrl:null,ratingAverage:null,reviewCount:0,isFavorite:true};
 const client=new ApiClient({baseUrl:'https://api.example/api',platform:'web',fetch:async(url,options)=>{
  paths.push(new URL(url).pathname);
  return new Response(JSON.stringify({code:'SUCCESS',result:options.method==='GET'?{items:[{favoriteId:'fav-id',accommodation:dto}],page:0,size:20,totalElements:1,totalPages:1}:null}));
 }});
 const api=createFavoritesApi(client),result=await api.list();
 assert.equal(result.items[0].stay.id,'stay-id');assert.equal(result.items[0].stay.nightlyPrice.amountCents,29900);
 await api.remove('stay-id');assert.deepEqual(paths,['/api/favorites','/api/favorites/stay-id']);
});
test('room lookup maps search rooms to quantity and comparison uses exact room identity',async()=>{
 const paths=[];const api=createCatalogApi({request:async(path)=>{paths.push(path);return path.includes('/rooms?')?[]:{offers:[]};}},()=>true);
 const s={...emptySearchSelection(),checkIn:'2026-11-01',checkOut:'2026-11-03',adults:3,children:1,rooms:2};
 await api.rooms('stay-id',s);
 await api.compare({accommodationId:'stay-id',roomId:'actual-room-uuid',checkIn:s.checkIn,checkOut:s.checkOut,quantity:2,adults:3,children:1});
 const rooms=new URL('https://test.invalid'+paths[0]).searchParams,compare=new URL('https://test.invalid'+paths[1]).searchParams;
 assert.equal(rooms.get('rooms'),'2');assert.equal(rooms.has('guests'),false);assert.equal(compare.get('quantity'),'2');
 assert.equal(compare.get('roomId'),'actual-room-uuid');assert.equal(compare.get('children'),'1');assert.equal(compare.has('rooms'),false);
});
