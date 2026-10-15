import {ApiError}from'../services/apiClient';import{mutationKey}from'./bookingDraft';
import type{RewardsApi}from'../services/rewardsApi';import type{ClaimStorage,PendingClaim}from'./pendingClaimStorage';import type{RewardWallet,RewardOfferDto,RewardClaimDto,RewardHistoryDto}from'../types/transaction';
type State={ownerId:string|null;wallet:RewardWallet|null;catalog:RewardOfferDto[];history:RewardHistoryDto[];claims:RewardClaimDto[];historyPage:number;claimsPage:number;moreHistory:boolean;moreClaims:boolean;pending:PendingClaim|null;busy:boolean;error:string};
const empty=(ownerId:string|null):State=>({ownerId,wallet:null,catalog:[],history:[],claims:[],historyPage:0,claimsPage:0,moreHistory:false,moreClaims:false,pending:null,busy:false,error:''});
export class RewardsStore{
 private api:RewardsApi;private storage:ClaimStorage;private state=empty(null);private version=0;private listeners=new Set<()=>void>();private abort:AbortController|null=null;
 constructor(api:RewardsApi,storage:ClaimStorage){this.api=api;this.storage=storage;}
 snapshot(){return JSON.parse(JSON.stringify(this.state)) as State;}subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn);};}private notify(){this.listeners.forEach(f=>f());}
 async changeOwner(ownerId:string|null){this.version++;this.abort?.abort();this.state=empty(ownerId);this.notify();if(!ownerId){await this.storage.clear();return;}const v=this.version,p=await this.storage.read();if(v!==this.version)return;if(p?.ownerId===ownerId){this.state.pending=p;this.notify();}else if(p)await this.storage.clear();}
 dispose(){this.version++;this.abort?.abort();this.listeners.clear();}
 private async run<T>(job:(v:number,signal:AbortSignal)=>Promise<T>):Promise<T|undefined>{
  if(!this.state.ownerId||this.state.busy)return;const v=this.version;this.abort=new AbortController();this.state.busy=true;this.state.error='';this.notify();
  try{return await job(v,this.abort.signal);}catch(e){if(v===this.version){this.state.error=e instanceof Error?e.message:'Unable to load rewards.';this.notify();throw e;}}
  finally{if(v===this.version){this.state.busy=false;this.notify();}}
 }
 private check(v:number){if(v!==this.version)throw new ApiError('SESSION_CHANGED',409,'Your session changed.');}
 private async reload(v:number,signal:AbortSignal){const [wallet,catalog,h,c]=await Promise.all([this.api.wallet(signal),this.api.catalog(signal),this.api.history(0,signal),this.api.claims(0,signal)]);this.check(v);this.state={...this.state,wallet,catalog,history:h.items,claims:c.items,historyPage:0,claimsPage:0,moreHistory:h.totalPages>1,moreClaims:c.totalPages>1};this.notify();}
 load(){return this.run((v,s)=>this.reload(v,s));}
 more(kind:'history'|'claims'){return this.run(async(v,s)=>{if(kind==='history'){const page=await this.api.history(this.state.historyPage+1,s);this.check(v);this.state.history.push(...page.items);this.state.historyPage=page.page;this.state.moreHistory=page.page+1<page.totalPages;}else{const page=await this.api.claims(this.state.claimsPage+1,s);this.check(v);this.state.claims.push(...page.items);this.state.claimsPage=page.page;this.state.moreClaims=page.page+1<page.totalPages;}this.notify();});}
 claim(offerId:string){return this.run(async(v,s)=>{
  if(this.state.pending&&this.state.pending.offerId!==offerId)throw new ApiError('RESOLVE_PENDING',409,'Retry the pending reward claim first.');
  if(!this.state.pending){this.state.pending={ownerId:this.state.ownerId!,offerId,key:mutationKey('reward')};await this.storage.write(this.state.pending);this.check(v);this.notify();}
  let claim;try{claim=await this.api.claim(offerId,this.state.pending.key,s);this.check(v);}catch(e){this.check(v);const code=(e as{code?:string}).code;if(code&&['INSUFFICIENT_POINTS','REWARD_INELIGIBLE','REWARD_NOT_FOUND','VALIDATION_ERROR'].includes(code)){await this.storage.clear();this.check(v);this.state.pending=null;this.notify();}throw e;}
  await this.storage.clear();this.check(v);this.state.pending=null;this.notify();await this.reload(v,s);return claim;
 });}
}
