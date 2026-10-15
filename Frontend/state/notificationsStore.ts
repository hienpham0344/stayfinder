import type{NotificationsApi}from'../services/notificationsApi';
import type{NotificationDto}from'../types/userFeatures';
import{mutationKey}from'./bookingDraft';
type State={items:NotificationDto[];unreadCount:number;loading:boolean;busy:boolean;error:string;hasMore:boolean;snapshotTime:string|null};
// Compare server UTC instants without truncating their micro/nanosecond precision.
function epochNanos(value:string):bigint|null{const m=/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z$/.exec(value);if(!m)return null;const seconds=Date.parse(m[1]+'Z');return Number.isFinite(seconds)?BigInt(seconds)*1000000n+BigInt((m[2]??'').padEnd(9,'0')):null;}
function atOrBefore(created:string,cutoff:string){const a=epochNanos(created),b=epochNanos(cutoff);return a!==null&&b!==null&&a<=b;}
const empty=():State=>({items:[],unreadCount:0,loading:false,busy:false,error:'',hasMore:false,snapshotTime:null});
export class NotificationsStore{
 private api:NotificationsApi;private owner:string|null=null;private generation=0;private readSequence=0;private countSequence=0;private page=-1;
 private abort=new AbortController();private state=empty();private listeners=new Set<()=>void>();
 constructor(api:NotificationsApi){this.api=api;}
 snapshot(){return this.state;}
 subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn);};}
 private publish(p:Partial<State>){this.state={...this.state,...p};this.listeners.forEach(fn=>fn());}
 changeOwner(id:string|null){this.generation++;this.readSequence++;this.countSequence++;this.abort.abort();this.abort=new AbortController();this.owner=id;this.page=-1;this.state=empty();this.publish({});}
 async refreshCount(){
  if(!this.owner)return;const g=this.generation,n=++this.countSequence;
  try{const r=await this.api.count(this.abort.signal);if(g===this.generation&&n===this.countSequence)this.publish({unreadCount:r.count});}
  catch(e){if(g===this.generation&&n===this.countSequence)this.publish({error:e instanceof Error?e.message:'Unable to refresh notifications.'});}
 }
 async load(more=false){
  if(!this.owner||this.state.loading||(more&&!this.state.hasMore))return;
  const g=this.generation,n=++this.readSequence,page=more?this.page+1:0;this.publish({loading:true,error:''});
  try{const r=await this.api.list(page,false,this.abort.signal);if(g!==this.generation||n!==this.readSequence)return;
   this.page=page;this.publish({items:[...new Map((more?[...this.state.items,...r.items]:r.items).map(x=>[x.id,x])).values()],snapshotTime:r.snapshotTime,hasMore:page+1<r.totalPages});
   await this.refreshCount();
  }catch(e){if(g===this.generation&&n===this.readSequence)this.publish({error:e instanceof Error?e.message:'Unable to load notifications.'});}
  // Mutations invalidate list contents, but the one pending load still owns its spinner.
  finally{if(g===this.generation)this.publish({loading:false});}
 }
 async markRead(id:string){
  if(!this.owner||this.state.busy)return;const g=this.generation;this.countSequence++;this.publish({busy:true,error:''});
  try{const item=await this.api.read(id,this.abort.signal);if(g!==this.generation)return;this.readSequence++;this.publish({items:this.state.items.map(x=>x.id===id?item:x)});await this.refreshCount();}
  catch(e){if(g===this.generation)this.publish({error:e instanceof Error?e.message:'Unable to mark read.'});throw e;}
  finally{if(g===this.generation)this.publish({busy:false});}
 }
 async markAllRead(){
  const cutoff=this.state.snapshotTime;if(!this.owner||!cutoff||this.state.busy)return;const g=this.generation;this.countSequence++;this.publish({busy:true,error:''});
  try{const r=await this.api.readAll(cutoff,mutationKey('inbox-read-all'),this.abort.signal);if(g!==this.generation)return;
   this.readSequence++;this.countSequence++;this.publish({unreadCount:r.unreadCount,items:this.state.items.map(x=>!x.readAt&&atOrBefore(x.createdAt,cutoff)?{...x,readAt:cutoff}:x)});
  }catch(e){if(g===this.generation)this.publish({error:e instanceof Error?e.message:'Unable to mark all read.'});throw e;}
  finally{if(g===this.generation)this.publish({busy:false});}
 }
}
