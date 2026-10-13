import React,{createContext,useContext,useEffect,useMemo,useState}from'react';import{useSession}from'./SessionProvider';import{createProfileApi}from'../services/profileApi';import{ProfileStore}from'./profileStore';
const Context=createContext<{store:ProfileStore;state:ReturnType<ProfileStore['snapshot']>}|null>(null);
export function ProfileProvider({children}:{children:React.ReactNode}){const{api,user}=useSession();const store=useMemo(()=>{const s=new ProfileStore(createProfileApi(api));s.changeOwner(user?.id??null);return s;},[api,user?.id]);const[,render]=useState(0);
 useEffect(()=>{const off=store.subscribe(()=>render(n=>n+1));void store.load();return()=>{off();store.changeOwner(null);};},[store]);
 return <Context.Provider value={{store,state:store.snapshot()}}>{children}</Context.Provider>;
}export function useProfile(){const c=useContext(Context);if(!c)throw new Error('ProfileProvider is required');return c;}
