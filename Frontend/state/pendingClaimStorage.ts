import type{PrivateKeyValue}from'./draftStorage';
export type PendingClaim={ownerId:string;offerId:string;key:string};
export type ClaimStorage={read():Promise<PendingClaim|null>;write(v:PendingClaim):Promise<void>;clear():Promise<void>};
export function createClaimStorage(port:PrivateKeyValue):ClaimStorage{
 let tail:Promise<unknown>=Promise.resolve();const order=<T,>(f:()=>Promise<T>)=>{const n=tail.then(f,f);tail=n.catch(()=>{});return n;};const key='stayfinder.reward.intent.v1';
 return{read:()=>order(async()=>{const raw=await port.get(key);if(!raw)return null;try{const v=JSON.parse(raw);return typeof v.ownerId==='string'&&typeof v.offerId==='string'&&typeof v.key==='string'?v:null;}catch{return null;}}),write:v=>order(()=>port.set(key,JSON.stringify(v))),clear:()=>order(()=>port.remove(key))};
}
