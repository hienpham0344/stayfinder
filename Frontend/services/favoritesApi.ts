import type { ApiClient } from './apiClient';
import type { PageResponse } from '../types/api';
import type { FavoriteDto } from '../types/catalog';
import { toStayCard } from './dtoAdapters';
export function createFavoritesApi(api: ApiClient) {
 return {
  list: async (page=0)=>{
   const result=await api.request<PageResponse<FavoriteDto>>('/favorites?page='+page+'&size=20');
   return {...result,items:result.items.map(f=>({favoriteId:f.favoriteId,stay:toStayCard(f.accommodation)}))};
  },
  add: (id: string)=>api.request<{id:string;accommodationId:string}>('/favorites/'+encodeURIComponent(id),{method:'PUT'}),
  remove: (id: string)=>api.request<void>('/favorites/'+encodeURIComponent(id),{method:'DELETE'}),
 };
}
