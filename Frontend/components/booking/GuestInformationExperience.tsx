import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSession } from '../../state/SessionProvider';
import { useCatalog, useCatalogResource } from '../../state/CatalogProvider';
import { validateSearchSelection, selectionForRoom, quoteSelectionParams } from '../../state/searchSelection';
import { Action, CatalogPage, Field, ResourceStatus, catalogStyles as s } from '../catalog/CatalogUi';
export function GuestInformationExperience(){
 const params=useLocalSearchParams<{accommodationId?:string;roomId?:string;checkIn?:string;checkOut?:string;quantity?:string;adults?:string;children?:string}>();
 const {selection,catalog}=useCatalog();const {user}=useSession();
 const criteria={...selection,checkIn:params.checkIn||'',checkOut:params.checkOut||'',rooms:Number(params.quantity),adults:Number(params.adults),children:Number(params.children)};
 const validation=validateSearchSelection(criteria,true)||(!params.accommodationId||!params.roomId?'Choose a room first.':'');
 const detail=useCatalogResource(signal=>validation?Promise.resolve(null):catalog.detail(params.accommodationId!,signal),'guest-detail:'+params.accommodationId+':'+validation);
 const rooms=useCatalogResource(signal=>validation?Promise.resolve([]):catalog.rooms(params.accommodationId!,criteria,signal),'guest-rooms:'+JSON.stringify(params));
 const room=rooms.data?.find(r=>r.id===params.roomId);
 const [name,setName]=useState(user?.fullName||''),[email,setEmail]=useState(user?.email||''),[phone,setPhone]=useState(user?.phone||''),[request,setRequest]=useState('');
 const [error,setError]=useState('');
 const continueToPayment=()=>{
  if(!name.trim()||!/^\S+@\S+\.\S+$/.test(email.trim())||phone.replace(/\D/g,'').length<7){setError('Enter your full name, a valid email address and phone number.');return;}
  // This transition carries the real selection; checkout will require a server quote.
  const quote=selectionForRoom(criteria,params.accommodationId!,params.roomId!);
  router.push({pathname:'/booking/checkout',params:quoteSelectionParams(quote)});
 };
 return <CatalogPage title="Guest information" back>
 {validation?<Text style={s.error}>{validation}</Text>:<>
 <ResourceStatus {...detail} retry={detail.reload}/><ResourceStatus {...rooms} retry={rooms.reload}/>
 {detail.data&&<Text style={s.heading}>{detail.data.title}</Text>}
 <Text style={s.text}>{room?.name} · {criteria.checkIn} → {criteria.checkOut} · {criteria.rooms} rooms · {criteria.adults} adults · {criteria.children} children</Text>
 {!user?<Action title="Sign in to book" onPress={()=>router.push({pathname:'/auth/demo',params:{mode:'login',returnTo:'/booking/guest-info?'+new URLSearchParams(quoteSelectionParams(selectionForRoom(criteria,params.accommodationId!,params.roomId!))).toString()}})}/>:<View style={{gap:12}}>
 <Field label="Full name" value={name} onChange={setName}/><Field label="Email address" value={email} onChange={setEmail}/><Field label="Phone number" value={phone} onChange={setPhone}/><Field label="Special requests (optional)" value={request} onChange={setRequest}/>
 {!!error&&<Text style={s.error}>{error}</Text>}<Action title="Continue" disabled={!room||rooms.loading||!!rooms.error} onPress={continueToPayment}/>
 </View>}
 </>}
 </CatalogPage>;
}
