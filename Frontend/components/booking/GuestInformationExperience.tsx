import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSession } from '../../state/SessionProvider';
import { useCatalog, useCatalogResource } from '../../state/CatalogProvider';
import { validateSearchSelection, selectionForRoom, quoteSelectionParams } from '../../state/searchSelection';
import { Action, CatalogPage, Field, ResourceStatus, catalogStyles as s } from '../catalog/CatalogUi';
import {useBookingDraft} from '../../state/BookingDraftProvider';
import {validateGuest} from '../../utils/guestValidation';
export function GuestInformationExperience(){
 const [hydrated,setHydrated]=useState(false);useEffect(()=>setHydrated(true),[]);
 const params=useLocalSearchParams<{accommodationId?:string;roomId?:string;checkIn?:string;checkOut?:string;quantity?:string;adults?:string;children?:string}>();
 const {selection,catalog}=useCatalog();const {user}=useSession();const draft=useBookingDraft();
 const criteria={...selection,checkIn:params.checkIn||'',checkOut:params.checkOut||'',rooms:Number(params.quantity),adults:Number(params.adults),children:Number(params.children)};
 const validation=validateSearchSelection(criteria,true)||(!params.accommodationId||!params.roomId?'Choose a room first.':'');
 const detail=useCatalogResource(signal=>validation?Promise.resolve(null):catalog.detail(params.accommodationId!,signal),'guest-detail:'+params.accommodationId+':'+validation);
 const rooms=useCatalogResource(signal=>validation?Promise.resolve([]):catalog.rooms(params.accommodationId!,criteria,signal),'guest-rooms:'+JSON.stringify(params));
 const room=rooms.data?.find(r=>r.id===params.roomId);
 const [name,setName]=useState(user?.fullName||''),[email,setEmail]=useState(user?.email||''),[phone,setPhone]=useState(user?.phone||''),[request,setRequest]=useState('');
 const [error,setError]=useState('');
 useEffect(()=>{setName(value=>value||user?.fullName||'');setEmail(value=>value||user?.email||'');setPhone(value=>value||user?.phone||'');},[user?.id]);
 const continueToPayment=async()=>{
  const errors=validateGuest(name,email,phone);const invalid=Object.values(errors).filter(Boolean).join(' ');
  if(invalid||request.trim().length>2000){setError(invalid||'Special requests must be at most 2000 characters.');return;}
  setError('');try{
   await draft.store.setGuest(selectionForRoom(criteria,params.accommodationId!,params.roomId!),{fullName:name.trim(),email:email.trim().toLowerCase(),phone:phone.replace(/\s/g,''),specialRequest:request.trim()||null});
   await draft.store.refreshQuote();router.push('/booking/checkout');
  }catch(e){setError(e instanceof Error?e.message:'Unable to get a quote. Please retry.');}
 };
 if(!hydrated)return <CatalogPage title="Guest information" back><Text style={s.text}>Loading selected room…</Text></CatalogPage>;
 return <CatalogPage title="Guest information" back>
 {validation?<Text style={s.error}>{validation}</Text>:<>
 <ResourceStatus {...detail} retry={detail.reload}/><ResourceStatus {...rooms} retry={rooms.reload}/>
 {detail.data&&<Text style={s.heading}>{detail.data.title}</Text>}
 <Text style={s.text}>{room?.name} · {criteria.checkIn} → {criteria.checkOut} · {criteria.rooms} rooms · {criteria.adults} adults · {criteria.children} children</Text>
 {!user?<Action title="Sign in to book" onPress={()=>router.push({pathname:'/auth/demo',params:{mode:'login',returnTo:'/booking/guest-info?'+new URLSearchParams(quoteSelectionParams(selectionForRoom(criteria,params.accommodationId!,params.roomId!))).toString()}})}/>:<View style={{gap:12}}>
 <Field label="Full name" value={name} onChange={setName}/><Field label="Email address" value={email} onChange={setEmail}/><Field label="Phone number" value={phone} onChange={setPhone}/><Field label="Special requests (optional)" value={request} onChange={setRequest}/>
 {!!(error||draft.initialError)&&<Text style={s.error}>{error||draft.initialError}</Text>}{draft.state.intent?.uncertain&&<Action title="Resume pending booking" secondary onPress={()=>router.push('/booking/checkout')}/>}<Action title="Continue" disabled={!room||rooms.loading||!!rooms.error||!draft.ready||draft.state.busy} onPress={()=>void continueToPayment()}/>
 </View>}
 </>}
 </CatalogPage>;
}
