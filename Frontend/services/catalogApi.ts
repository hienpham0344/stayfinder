import type { ApiClient } from './apiClient';
import type { CatalogFilters, LocationDto, StayDetailDto, RoomTierDto, CatalogPage, QuoteSelection, ComparisonResult } from '../types/catalog';
import type { SearchSelection } from '../state/searchSelection';
import { toStayCard, toStayDetail, toRoomTier } from './dtoAdapters';
export function queryString(values: Record<string,unknown>): string {
 const params = new URLSearchParams();
 Object.entries(values).forEach(([key,value])=>{
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return;
  params.set(key,Array.isArray(value)?value.join(','):String(value));
 });
 return params.toString();
}
export function createCatalogApi(api: ApiClient, authenticated: ()=>boolean) {
 const get = <T,>(path: string, signal?: AbortSignal)=>api.request<T>(path,{ auth: authenticated(), signal });
 return {
  filters: (signal?: AbortSignal)=>get<CatalogFilters>('/catalog/filters',signal),
  suggestions: (q: string,signal?: AbortSignal)=>get<LocationDto[]>('/locations/suggestions?'+queryString({q}),signal),
  search: async (selection: SearchSelection, page=0, section?: string, signal?: AbortSignal)=>{
   const { locationLabel, ...criteria } = selection;
   const result=await get<CatalogPage>('/accommodations?'+queryString({...criteria,page,size:20,section}),signal);
   return {...result,items:result.items.map(toStayCard)};
  },
  detail: async (id: string,signal?: AbortSignal)=>toStayDetail(await get<StayDetailDto>('/accommodations/'+encodeURIComponent(id),signal)),
  rooms: async (id: string,s: SearchSelection,signal?: AbortSignal)=>(await get<RoomTierDto[]>('/accommodations/'+encodeURIComponent(id)+'/rooms?'+queryString({
   checkIn:s.checkIn,checkOut:s.checkOut,adults:s.adults,children:s.children,rooms:s.rooms
  }),signal)).map(toRoomTier),
  compare: (s: QuoteSelection,signal?: AbortSignal)=>get<ComparisonResult>('/accommodations/'+encodeURIComponent(s.accommodationId)+'/price-comparisons?'+queryString({
   roomId:s.roomId,checkIn:s.checkIn,checkOut:s.checkOut,quantity:s.quantity,adults:s.adults,children:s.children
  }),signal),
 };
}
