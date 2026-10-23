import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCatalog, useCatalogResource } from '../../state/CatalogProvider';
import { cancelSearchSelection, quoteSelectionParams, selectionForRoom, validateSearchSelection } from '../../state/searchSelection';
import type { QuoteSelection } from '../../types/catalog';
import{useUsdFormatter}from'../../state/useUsdFormatter';
import { ComparePricesModal } from './ComparePricesModal';
import { Action, CatalogPage, ResourceStatus, SelectionFields, StayImage, catalogStyles as s } from '../catalog/CatalogUi';
export function RoomSelectionExperience(){
 const formatUsd=useUsdFormatter();
 const params=useLocalSearchParams<{id?:string;accommodationId?:string;checkIn?:string;checkOut?:string;quantity?:string;adults?:string;children?:string}>();
 const id=params.id||params.accommodationId||'';
 const {catalog,selection,apply}=useCatalog();
 const criteria=useMemo(()=>params.checkIn||params.checkOut?{...selection,checkIn:params.checkIn||'',checkOut:params.checkOut||'',
  rooms:Number(params.quantity),adults:Number(params.adults),children:Number(params.children)}:selection,[selection,params.checkIn,params.checkOut,params.quantity,params.adults,params.children]);
 const [draft,setDraft]=useState(()=>cancelSearchSelection(criteria)),[editing,setEditing]=useState(false),[error,setError]=useState('');
 const [comparison,setComparison]=useState<QuoteSelection|null>(null);
 const validation=validateSearchSelection(criteria,true);
 const result=useCatalogResource(signal=>validation?Promise.resolve([]):catalog.rooms(id,criteria,signal),'rooms:'+id+':'+JSON.stringify(criteria));
 const detail=useCatalogResource(signal=>catalog.detail(id,signal),'detail:'+id);
 const submit=()=>{
  const message=validateSearchSelection(draft,true);if(message){setError(message);return;}
  apply(draft);setEditing(false);setError('');
  // Replace route selection too, so a deep link cannot override later edits.
  router.setParams({checkIn:draft.checkIn,checkOut:draft.checkOut,quantity:String(draft.rooms),adults:String(draft.adults),children:String(draft.children)});
 };
 return <CatalogPage title="Select your room" back>
 {detail.data&&<Text style={s.heading}>{detail.data.title}</Text>}
 <Text style={s.text}>{criteria.checkIn||'Choose dates'} → {criteria.checkOut} · {criteria.rooms} rooms · {criteria.adults} adults · {criteria.children} children</Text>
 <Action title="Change dates and guests" secondary onPress={()=>{setDraft(cancelSearchSelection(criteria));setEditing(true);setError('');}}/>
 {(editing||!!validation)&&<View style={{gap:12}}><SelectionFields value={draft} onChange={setDraft}/>{!!error&&<Text style={s.error}>{error}</Text>}<View style={s.row}><Action title="Apply dates and guests" onPress={submit}/>{editing&&<Action title="Cancel" secondary onPress={()=>{setDraft(cancelSearchSelection(criteria));setEditing(false);setError('');}}/>}</View></View>}
 {validation?<Text style={s.error}>{validation}</Text>:<>
 <ResourceStatus {...result} retry={result.reload} empty={result.data?.length===0} emptyText="No room has enough stock and capacity for this selection. Change the dates, guests or room quantity."/>
 {result.data?.map(room=><View key={room.id} style={s.card}>
 <StayImage key={room.imageUrls[0]} url={room.imageUrls[0]||null} title={room.name}/>
 <View style={s.cardBody}><Text style={s.heading}>{room.name}</Text>{!!room.description&&<Text style={s.text}>{room.description}</Text>}
 <Text style={s.text}>Up to {room.maxGuestsPerRoom} guests per room · {room.availableCount} rooms available</Text>
 {room.sizeSqm!=null&&<Text style={s.text}>{room.sizeSqm} m²</Text>}{!!room.bedType&&<Text style={s.text}>{room.bedType}</Text>}
 {room.includesBreakfast!=null&&<Text style={s.text}>{room.includesBreakfast?'Breakfast included':'Breakfast excluded'}</Text>}
 <Text style={s.text}>{room.cancellationPolicy.freeBeforeCheckIn?'Free cancellation before check-in at '+room.cancellationPolicy.checkInLocalTime+' ('+room.cancellationPolicy.timezone+')':'See cancellation terms before booking'}</Text>
 <Text style={s.price}>{formatUsd(room.nightlyPrice)} / room / night</Text>
 <Action title="Compare demo trip prices" secondary onPress={()=>setComparison(selectionForRoom(criteria,id,room.id))}/>
 <Action title={'Continue with '+criteria.rooms+' rooms'} disabled={room.availableCount<criteria.rooms} onPress={()=>router.push({pathname:'/booking/guest-info',params:quoteSelectionParams(selectionForRoom(criteria,id,room.id))})}/>
 </View></View>)}
 </>}
 {comparison&&<ComparePricesModal visible onClose={()=>setComparison(null)} selection={comparison}/>}
 </CatalogPage>;
}
