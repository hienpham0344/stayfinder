import type { StayCardModel } from '../types/stay';
import type { PageResponse } from '../types/api';
type Entry = { favoriteId:string; stay:StayCardModel };
type Api = { list:(page?:number)=>Promise<PageResponse<Entry>>; add:(id:string)=>Promise<unknown>; remove:(id:string)=>Promise<unknown> };
type Snapshot = { items:StayCardModel[]; loading:boolean; error:string; total:number; hasMore:boolean; busy:Set<string> };
export class FavoritesStore {
 private readonly api:Api; private owner:string|null=null; private generation=0; private readSequence=0; private page=-1;
 private values=new Map<string,boolean>(); private listeners=new Set<()=>void>();
 private state:Snapshot={items:[],loading:false,error:'',total:0,hasMore:false,busy:new Set()};
 constructor(api:Api){this.api=api;}
 subscribe(listener:()=>void){this.listeners.add(listener);return ()=>{this.listeners.delete(listener);};}
 snapshot(){return this.state;}
 private publish(partial:Partial<Snapshot>){this.state={...this.state,...partial};this.listeners.forEach(l=>l());}
 changeOwner(owner:string|null){
  if(this.owner===owner)return;this.owner=owner;this.generation++;this.readSequence++;this.page=-1;this.values.clear();
  this.publish({items:[],loading:false,error:'',total:0,hasMore:false,busy:new Set()});
 }
 isSaved(id:string,fallback=false){return this.owner ? this.values.get(id)??fallback : false;}
 async load(more=false):Promise<void>{
  if(!this.owner || (more && (!this.state.hasMore||this.state.loading)))return;
  const generation=this.generation, sequence=++this.readSequence, page=more?this.page+1:0;
  this.publish({loading:true});
  try{
   const result=await this.api.list(page);if(generation!==this.generation||sequence!==this.readSequence)return;
   const incoming=result.items.map(f=>f.stay);
   incoming.forEach(s=>{if(!this.state.busy.has(s.id))this.values.set(s.id,true);});
   if(!more){const returned=new Set(incoming.map(s=>s.id));this.values.forEach((v,id)=>{if(v&&!returned.has(id)&&!this.state.busy.has(id))this.values.delete(id);});}
   const pendingItems=this.state.items.filter(s=>this.state.busy.has(s.id)&&this.values.get(s.id));
   const combined=more?[...this.state.items,...incoming]:[...incoming,...pendingItems];
   const items=[...new Map(combined.map(s=>[s.id,s])).values()].filter(s=>!this.state.busy.has(s.id)||this.values.get(s.id));
   this.page=page;this.publish({items,loading:false,total:result.totalElements,hasMore:page+1<result.totalPages});
  }catch(error){if(generation===this.generation&&sequence===this.readSequence)this.publish({loading:false,error:error instanceof Error?error.message:'Unable to load saved stays.'});}
 }
 async toggle(stay:StayCardModel):Promise<void>{
  if(!this.owner)throw new Error('Sign in to save a stay.');
  if(this.state.busy.has(stay.id))return;
  const generation=this.generation, previous=this.isSaved(stay.id,stay.isFavorite), next=!previous;
  const beforeItems=this.state.items;this.values.set(stay.id,next);
  const busy=new Set(this.state.busy);busy.add(stay.id);
  this.publish({busy,error:'',items:next?[...beforeItems.filter(s=>s.id!==stay.id),{...stay,isFavorite:true}]:beforeItems.filter(s=>s.id!==stay.id)});
  try{
   await (next?this.api.add(stay.id):this.api.remove(stay.id));
   if(generation!==this.generation)return;
   const remaining=new Set(this.state.busy);remaining.delete(stay.id);this.publish({busy:remaining});
   await this.load();
  }catch(error){
   if(generation!==this.generation)return;
   this.values.set(stay.id,previous);const remaining=new Set(this.state.busy);remaining.delete(stay.id);
   // Restore only this stay; preserve changes to other concurrently saved stays.
   const items=this.state.items.filter(s=>s.id!==stay.id);
   if(previous)items.push(beforeItems.find(s=>s.id===stay.id)??stay);
   this.publish({items,busy:remaining,error:error instanceof Error?error.message:'Unable to update wishlist.'});
   await this.load();
  }
 }
}
