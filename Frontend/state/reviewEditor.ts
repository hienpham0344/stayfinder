import type{ReviewsApi}from'../services/reviewsApi';import type{PhotoPort}from'../services/photoFlow';import{pickAndUploadPhoto}from'../services/photoFlow';import type{ReviewDto}from'../types/userFeatures';
type Photo={id:string;displayUrl:string;uploaded:boolean};type Source={stayId:string;bookingId?:string;review?:ReviewDto};
type State={owner:string|null;source:Source|null;rating:number;comment:string;photos:Photo[];busy:boolean;error:string};
const empty=():State=>({owner:null,source:null,rating:5,comment:'',photos:[],busy:false,error:''});
function photoId(url:string){const match=/^\/api\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/content\?/.exec(url);if(!match)throw new Error('Photo link is invalid. Refresh the review.');return match[1];}
export class ReviewEditor{
 private state=empty();private generation=0;private api:ReviewsApi;private photos:PhotoPort;private media:{delete:(id:string)=>Promise<unknown>};private listeners=new Set<()=>void>();
 constructor(api:ReviewsApi,photos:PhotoPort,media:{delete:(id:string)=>Promise<unknown>}){this.api=api;this.photos=photos;this.media=media;}
 snapshot(){return this.state;}subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn);};}
 private publish(p:Partial<State>){this.state={...this.state,...p};this.listeners.forEach(fn=>fn());}
 start(owner:string,source:Source){if(source.review&&!source.review.isMine)throw new Error('You can edit only your own review.');if(!source.review&&!source.bookingId)throw new Error('Choose a completed booking first.');
  this.generation++;this.state={...empty(),owner,source,rating:source.review?.rating??5,comment:source.review?.comment??'',photos:source.review?.imageUrls.map(url=>({id:photoId(url),displayUrl:url,uploaded:false}))??[]};this.publish({});}
 clear(){this.generation++;this.state=empty();this.publish({});}
 setText(rating:number,comment:string){if(this.state.busy)return;this.publish({rating,comment});}
 private check(g:number){if(g!==this.generation||!this.state.owner)throw new Error('Your session changed. Sign in again.');}
 private async run<T>(job:(g:number)=>Promise<T>){if(!this.state.owner||!this.state.source)throw new Error('Choose a booking or review first.');if(this.state.busy)throw new Error('Please wait for the current request.');const g=this.generation;this.publish({busy:true,error:''});
  try{return await job(g);}catch(e){if(g===this.generation)this.publish({error:e instanceof Error?e.message:'Unable to save. Please retry.'});throw e;}finally{if(g===this.generation)this.publish({busy:false});}}
 addPhoto(){return this.run(async g=>{if(this.state.photos.length>=5)throw new Error('You can attach up to five photos.');const result=await pickAndUploadPhoto(this.photos);this.check(g);if(result)this.publish({photos:[...this.state.photos,{id:result.id,displayUrl:result.displayUrl,uploaded:true}]});});}
 removePhoto(id:string){return this.run(async g=>{const photo=this.state.photos.find(p=>p.id===id);if(!photo)return;if(photo.uploaded){await this.media.delete(id);this.check(g);}this.publish({photos:this.state.photos.filter(p=>p.id!==id)});});}
 submit(){return this.run(async g=>{const source=this.state.source!;if(!Number.isInteger(this.state.rating)||this.state.rating<1||this.state.rating>5||this.state.comment.length>2000)throw new Error('Choose 1–5 stars and use up to 2000 characters.');
  const body={rating:this.state.rating,comment:this.state.comment,mediaIds:this.state.photos.map(p=>p.id)};
  const result=source.review?await this.api.patch(source.review.id,body):await this.api.create(source.stayId,{bookingId:source.bookingId!,...body});this.check(g);
  this.publish({photos:this.state.photos.map(p=>({...p,uploaded:false}))});return result;});}
 async discard(){if(this.state.busy)return;const g=this.generation;await Promise.allSettled(this.state.photos.filter(p=>p.uploaded).map(p=>this.media.delete(p.id)));if(g===this.generation)this.clear();}
}
