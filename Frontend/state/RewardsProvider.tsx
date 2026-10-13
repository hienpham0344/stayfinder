import React,{createContext,useContext,useEffect,useMemo,useState}from'react';import{useSession}from'./SessionProvider';import{createRewardsApi}from'../services/rewardsApi';import{RewardsStore}from'./rewardsStore';import{privateClaimStorage}from'./privateDraftStorage';
const Context=createContext<{store:RewardsStore;state:ReturnType<RewardsStore['snapshot']>;ready:boolean;initialError:string}|null>(null);
export function RewardsProvider({children}:{children:React.ReactNode}){
 const {api,user,loading}=useSession(),owner=user?.id??null;const store=useMemo(()=>new RewardsStore(createRewardsApi(api),privateClaimStorage),[api,owner,loading]);
 const [view,setView]=useState<{store:RewardsStore;ready:boolean;error:string}>({store,ready:false,error:''});const [,render]=useState(0);
 useEffect(()=>{let active=true;const off=store.subscribe(()=>{if(active)render(n=>n+1);});if(!loading)void store.changeOwner(owner).then(()=>{if(active)setView({store,ready:true,error:''});}).catch(e=>{if(active)setView({store,ready:false,error:e instanceof Error?e.message:'Unable to restore rewards.'});});return()=>{active=false;off();store.dispose();};},[store,owner,loading]);
 return <Context.Provider value={{store,state:store.snapshot(),ready:view.store===store&&view.ready,initialError:view.store===store?view.error:''}}>{children}</Context.Provider>;
}
export function useRewards(){const value=useContext(Context);if(!value)throw new Error('RewardsProvider is required');return value;}
