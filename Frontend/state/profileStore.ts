import type{ProfileApi}from'../services/profileApi';import type{ProfileDto,Preferences,ProfilePatch,SupportReportRequest,SupportReportResult}from'../types/userFeatures';import{mutationKey}from'./bookingDraft';
type State={profile:ProfileDto|null;preferences:Preferences|null;loading:boolean;busy:boolean;error:string;pendingReport:{body:SupportReportRequest;key:string}|null};
const empty=():State=>({profile:null,preferences:null,loading:false,busy:false,error:'',pendingReport:null});
export class ProfileStore{
 private api:ProfileApi;private state=empty();private owner:string|null=null;private generation=0;private abort=new AbortController();private listeners=new Set<()=>void>();
 constructor(api:ProfileApi){this.api=api;}snapshot(){return this.state;}subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn);};}
 private publish(p:Partial<State>){this.state={...this.state,...p};this.listeners.forEach(fn=>fn());}
 changeOwner(owner:string|null){this.generation++;this.abort.abort();this.abort=new AbortController();this.owner=owner;this.state=empty();this.publish({});}
 private check(g:number){if(g!==this.generation||!this.owner)throw new Error('Your session changed. Sign in again.');}
 async load(){if(!this.owner||this.state.loading||this.state.busy)return;const g=this.generation;this.publish({loading:true,error:''});
 try{const[profile,preferences]=await Promise.all([this.api.get(this.abort.signal),this.api.preferences(this.abort.signal)]);this.check(g);this.publish({profile,preferences});}
 catch(e){if(g===this.generation)this.publish({error:e instanceof Error?e.message:'Unable to load profile.'});}
 finally{if(g===this.generation)this.publish({loading:false});}}
 private async mutate<T>(job:(g:number)=>Promise<T>){if(!this.owner)throw new Error('Sign in to continue.');if(this.state.busy||this.state.loading)throw new Error('Please wait for the current request.');const g=this.generation;this.publish({busy:true,error:''});
 try{return await job(g);}catch(e){if(g===this.generation)this.publish({error:e instanceof Error?e.message:'Unable to save. Try again.'});throw e;}finally{if(g===this.generation)this.publish({busy:false});}}
 save(body:ProfilePatch){return this.mutate(async g=>{const profile=await this.api.patch(body,this.abort.signal);this.check(g);this.publish({profile});return profile;});}
 savePreferences(body:Partial<Preferences>){return this.mutate(async g=>{const preferences=await this.api.patchPreferences(body,this.abort.signal);this.check(g);this.publish({preferences});return preferences;});}
 report(body:SupportReportRequest):Promise<SupportReportResult>{return this.mutate(async g=>{
 const previous=this.state.pendingReport;if(previous&&JSON.stringify(previous.body)!==JSON.stringify(body))throw new Error('Retry the pending report with its original details first.');
 const pending=previous??{body:JSON.parse(JSON.stringify(body)) as SupportReportRequest,key:mutationKey('support')};this.publish({pendingReport:pending});
 try{const result=await this.api.report(pending.body,pending.key,this.abort.signal);this.check(g);this.publish({pendingReport:null});return result;}
 catch(e){this.check(g);if(['VALIDATION_ERROR','BOOKING_NOT_FOUND','IDEMPOTENCY_CONFLICT'].includes((e as{code?:string}).code??''))this.publish({pendingReport:null});throw e;}
 });}
}
