import React,{createContext,useContext,useEffect,useMemo,useState}from'react';
import {useSession}from'./SessionProvider';import {BookingDraftStore}from'./bookingDraft';import {privateDraftStorage}from'./privateDraftStorage';import {createBookingApi}from'../services/bookingApi';import {createPaymentApi}from'../services/paymentApi';
const Context=createContext<{store:BookingDraftStore;state:ReturnType<BookingDraftStore['snapshot']>;ready:boolean;initialError:string}|null>(null);
export function BookingDraftProvider({children}:{children:React.ReactNode}){
 const {api,user,loading}=useSession(),owner=user?.id??null;
 const store=useMemo(()=>new BookingDraftStore(createBookingApi(api),createPaymentApi(api),privateDraftStorage),[api,owner,loading]);
 const [view,setView]=useState<{store:BookingDraftStore;ready:boolean;error:string}>({store,ready:false,error:''});const [,render]=useState(0);
 useEffect(()=>{let active=true;const off=store.subscribe(()=>{if(active)render(n=>n+1);});
  if(!loading)void store.changeOwner(owner).then(()=>{if(active)setView({store,ready:true,error:''});}).catch(e=>{if(active)setView({store,ready:false,error:e instanceof Error?e.message:'Unable to restore your booking.'});});
  return()=>{active=false;off();store.dispose();};
 },[store,owner,loading]);
 return <Context.Provider value={{store,state:store.snapshot(),ready:view.store===store&&view.ready,initialError:view.store===store?view.error:''}}>{children}</Context.Provider>;
}
export function useBookingDraft(){const value=useContext(Context);if(!value)throw new Error('BookingDraftProvider is required');return value;}
