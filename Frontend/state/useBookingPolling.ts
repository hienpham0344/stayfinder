import{useCallback,useEffect,useState}from'react';import{AppState}from'react-native';import{useFocusEffect}from'expo-router';import{shouldPollBank}from'./bookingDraft';import{useBookingDraft}from'./BookingDraftProvider';
export function useBookingPolling(){
 const {store,state}=useBookingDraft();const [focused,setFocused]=useState(false),[active,setActive]=useState(AppState.currentState==='active'),[now,setNow]=useState(Date.now());
 useFocusEffect(useCallback(()=>{setFocused(true);return()=>setFocused(false);},[]));
 useEffect(()=>{const sub=AppState.addEventListener('change',s=>setActive(s==='active'));return()=>sub.remove();},[]);
 useEffect(()=>{if(!focused||!active)return;const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[focused,active]);
 useEffect(()=>{if(!shouldPollBank(state.booking,state.payment,Date.now(),focused&&active)||state.busy||state.error)return;const t=setTimeout(()=>{void store.refreshStatus().catch(()=>{});},3000);return()=>clearTimeout(t);},[store,state.booking?.id,state.booking?.status,state.booking?.paymentMethod,state.booking?.holdExpiresAt,state.payment?.id,state.payment?.status,state.busy,state.error,focused,active,now>=Date.parse(state.booking?.holdExpiresAt??'')]);
 return now;
}
