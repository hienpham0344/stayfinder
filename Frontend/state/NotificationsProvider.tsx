import React,{createContext,useContext,useEffect,useMemo,useState}from'react';import{AppState}from'react-native';
import{useSession}from'./SessionProvider';import{useBookingDraft}from'./BookingDraftProvider';import{useRewards}from'./RewardsProvider';import{NotificationsStore}from'./notificationsStore';import{createNotificationsApi}from'../services/notificationsApi';
const Context=createContext<{store:NotificationsStore;state:ReturnType<NotificationsStore['snapshot']>}|null>(null);
export function NotificationsProvider({children}:{children:React.ReactNode}){
 const{api,user}=useSession();const{state:draft}=useBookingDraft(),{state:rewards}=useRewards();const store=useMemo(()=>{const s=new NotificationsStore(createNotificationsApi(api));s.changeOwner(user?.id??null);return s;},[api,user?.id]);const[,render]=useState(0);
 useEffect(()=>{const off=store.subscribe(()=>render(n=>n+1));void store.refreshCount();const tick=()=>{if(AppState.currentState==='active'||AppState.currentState==null)void store.refreshCount();};
 const timer=setInterval(tick,15000),listener=AppState.addEventListener('change',state=>{if(state==='active')void store.refreshCount();});
 return()=>{clearInterval(timer);listener.remove();off();store.changeOwner(null);};},[store]);
 useEffect(()=>{void store.refreshCount();const delayed=setTimeout(()=>void store.refreshCount(),2500);return()=>clearTimeout(delayed);},[store,draft.booking?.id,draft.booking?.status,draft.payment?.status,rewards.claims[0]?.id,rewards.wallet?.availablePoints]);
 return <Context.Provider value={{store,state:store.snapshot()}}>{children}</Context.Provider>;
}export function useNotifications(){const c=useContext(Context);if(!c)throw new Error('NotificationsProvider is required');return c;}
