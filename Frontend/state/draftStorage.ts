import type {DraftStorage,SavedDraft} from './bookingDraft';
export type PrivateKeyValue={get(key:string):Promise<string|null>;set(key:string,value:string):Promise<void>;remove(key:string):Promise<void>};
const prefix='stayfinder.booking.v1',limit=64;
export function createDraftStorage(port:PrivateKeyValue):DraftStorage{
 let tail:Promise<unknown>=Promise.resolve();
 const ordered=<T,>(job:()=>Promise<T>):Promise<T>=>{const next=tail.then(job,job);tail=next.catch(()=>{});return next;};
 const manifest=async()=>{const raw=await port.get(prefix+'.manifest');if(!raw)return null;try{const m=JSON.parse(raw);return (m.slot==='a'||m.slot==='b')&&Number.isInteger(m.count)&&m.count>0&&m.count<=limit?m as {slot:string;count:number}:null;}catch{return null;}};
 return{
  read:()=>ordered(async()=>{const m=await manifest();if(!m)return null;let text='';for(let i=0;i<m.count;i++){const part=await port.get(prefix+'.'+m.slot+'.'+i);if(part===null)return null;text+=part;}try{return JSON.parse(text) as SavedDraft;}catch{return null;}}),
  write:value=>ordered(async()=>{const text=Array.from(JSON.stringify(value)),count=Math.ceil(text.length/200);if(count>limit)throw new Error('Guest information is too large to save securely. Shorten the special request.');const old=await manifest(),slot=old?.slot==='a'?'b':'a';for(let i=0;i<count;i++)await port.set(prefix+'.'+slot+'.'+i,text.slice(i*200,(i+1)*200).join(''));await port.set(prefix+'.manifest',JSON.stringify({slot,count}));if(old)for(let i=0;i<old.count;i++)await port.remove(prefix+'.'+old.slot+'.'+i);}),
  clear:()=>ordered(async()=>{await port.remove(prefix+'.manifest');for(const slot of ['a','b'])for(let i=0;i<limit;i++)await port.remove(prefix+'.'+slot+'.'+i);}),
 };
}
