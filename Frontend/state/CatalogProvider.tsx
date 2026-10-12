import React, { createContext, useContext, useMemo, useState, useEffect, useRef } from 'react';
import { useSession } from './SessionProvider';
import { createCatalogApi } from '../services/catalogApi';
import { emptySearchSelection, applySearchSelection, SearchRequestSequencer, type SearchSelection } from './searchSelection';
const Context = createContext<{
 catalog: ReturnType<typeof createCatalogApi>; selection: SearchSelection; apply: (s:SearchSelection)=>void;
} | null>(null);
export function CatalogProvider({children}:{children:React.ReactNode}) {
 const {api,session}=useSession();
 const catalog=useMemo(()=>createCatalogApi(api,()=>!!session.getAccessToken()),[api,session]);
 const [selection,setSelection]=useState(emptySearchSelection);
 const value=useMemo(()=>({catalog,selection,apply:(s:SearchSelection)=>setSelection(applySearchSelection(s))}),[catalog,selection]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCatalog(){
 const value=useContext(Context);if(!value)throw new Error('CatalogProvider is required');return value;
}
export function useCatalogResource<T>(loader:(signal:AbortSignal)=>Promise<T>, key:string) {
 const {user}=useSession();const owner=user?.id??'guest';const resourceKey=owner+':'+key;
 const loaderRef=useRef(loader);loaderRef.current=loader;
 const sequencer=useRef(new SearchRequestSequencer()).current;
 const [retry,setRetry]=useState(0);
 const [state,setState]=useState<{key:string;data:T|null;loading:boolean;error:string}>({key:resourceKey,data:null,loading:true,error:''});
 useEffect(()=>{
  const sequence=sequencer.next(),controller=new AbortController();
  setState({key:resourceKey,data:null,loading:true,error:''});
  loaderRef.current(controller.signal).then(data=>{
   if(sequencer.accept(sequence))setState({key:resourceKey,data,loading:false,error:''});
  }).catch(error=>{
   if(sequencer.accept(sequence)&&!controller.signal.aborted)setState({key:resourceKey,data:null,loading:false,error:error instanceof Error?error.message:'Unable to load. Please try again.'});
  });
  return()=>{sequencer.invalidate();controller.abort();};
 },[resourceKey,retry,sequencer]);
 const current=state.key===resourceKey?state:{data:null,loading:true,error:''};
 return {data:current.data,loading:current.loading,error:current.error,reload:()=>setRetry(n=>n+1)};
}
