import React, { useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCatalog, useCatalogResource } from '../../state/CatalogProvider';
import { useFavorites } from '../../state/FavoritesProvider';
import { validateSearchSelection } from '../../state/searchSelection';
import{useUsdFormatter}from'../../state/useUsdFormatter';
import { Action, CatalogPage, FavoriteButton, ResourceStatus, StayImage, catalogStyles as s } from '../catalog/CatalogUi';
import{ReviewsExperience}from'../reviews/ReviewsExperience';
export function RoomDetailExperience(){
 const formatUsd=useUsdFormatter();
 const {id}=useLocalSearchParams<{id:string}>();const {catalog,selection}=useCatalog();
 const {state:favorites}=useFavorites();const [error,setError]=useState('');
 const result=useCatalogResource(signal=>catalog.detail(id||'',signal),'detail:'+id);
 const stay=result.data;
 const choose=()=>validateSearchSelection(selection,true)?router.push({pathname:'/search',params:{entry:'criteria',returnStayId:id}}):router.push({pathname:'/room/select',params:{id}});
 const map=async()=>{
  if(!stay?.coordinates)return;
  try{await Linking.openURL('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(stay.coordinates.latitude+','+stay.coordinates.longitude));}
  catch{setError('Unable to open maps. Please try again.');}
 };
 return <CatalogPage title={stay?.title||'Stay details'} back>
 <ResourceStatus {...result} retry={result.reload}/>
 {stay&&<>
 <View style={s.card}><StayImage key={stay.imageUrl} title={stay.title} url={stay.imageUrl}/><FavoriteButton stay={stay}/></View>
 {stay.images.length>1&&<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12}}>{stay.images.map((url,index)=><View key={url+index} style={{width:240,borderRadius:20,overflow:'hidden'}}><StayImage url={url} title={stay.title+' photo '+(index+1)}/></View>)}</ScrollView>}
 {!!favorites.error&&<Text accessibilityRole="alert" style={s.error}>{favorites.error}</Text>}
 <Text style={s.heading}>{stay.typeName}</Text>
 {stay.locationLabel&&<Text style={s.text}>{stay.locationLabel}</Text>}
 {!!stay.address&&<Text style={s.text}>{stay.address}</Text>}
 {stay.coordinates&&<Action title="Open property location in maps" secondary onPress={()=>void map()}/>}
 <Text style={s.text}>{stay.rating!=null?stay.rating.toFixed(1)+' · '+stay.reviewCount+' reviews':'No reviews yet'}</Text>
 {!!stay.description&&<><Text style={s.heading}>About this stay</Text><Text style={s.text}>{stay.description}</Text></>}
 <View style={s.row}>{stay.bedrooms!=null&&<Text style={s.text}>{stay.bedrooms} bedrooms</Text>}{stay.beds!=null&&<Text style={s.text}>{stay.beds} beds</Text>}{stay.baths!=null&&<Text style={s.text}>{stay.baths} baths</Text>}</View>
 {stay.amenities.length>0&&<><Text style={s.heading}>Amenities</Text><View style={s.row}>{stay.amenities.map(a=><View key={a.id} style={s.chip}><Text style={s.text}>{a.name}</Text></View>)}</View></>}
 {!!stay.host?.fullName&&<><Text style={s.heading}>Hosted by {stay.host.fullName}</Text></>}
 <Text style={s.heading}>Your stay</Text>
 <Text style={s.text}>{selection.checkIn?selection.checkIn+' → '+selection.checkOut:'Choose dates'} · {selection.adults} adults · {selection.children} children · {selection.rooms} rooms</Text>
 <Text style={s.price}>From {formatUsd(stay.nightlyPrice)} / room / night</Text>
 <Text style={s.text}>Cleaning fee {formatUsd(stay.cleaningFee)} · Service fee {formatUsd(stay.serviceFee)} per booking</Text>
 <Action title="Select a room and compare demo prices" onPress={choose}/>
 {!!error&&<Text style={s.error}>{error}</Text>}
 <ReviewsExperience stayId={stay.id} onChanged={result.reload}/>
 </>}
 </CatalogPage>;
}
