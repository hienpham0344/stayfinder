import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useCatalog, useCatalogResource } from '../../state/CatalogProvider';
import { useFavorites } from '../../state/FavoritesProvider';
import { cancelSearchSelection, validateSearchSelection, parseUsdCents, quoteSelectionParams, type SearchSelection } from '../../state/searchSelection';
import { Action, CatalogPage, Field, LiveStayCard, ResourceStatus, SelectionFields, catalogStyles as s } from '../catalog/CatalogUi';
type Editor='criteria'|'filters'|null;
export function SearchExperience(){
 const params=useLocalSearchParams<{entry?:string;returnStayId?:string}>();
 const {catalog,selection,apply}=useCatalog();const {state:favorites}=useFavorites();
 const [editor,setEditor]=useState<Editor>(params.entry==='criteria'?'criteria':params.entry==='filters'?'filters':null);
 const [draft,setDraft]=useState(()=>cancelSearchSelection(selection)),[error,setError]=useState('');
 const [min,setMin]=useState(''),[max,setMax]=useState('');
 const [suggestionQuery,setSuggestionQuery]=useState('');
 const [pagination,setPagination]=useState({key:'',page:0});
 const key=JSON.stringify(selection),page=pagination.key===key?pagination.page:0;
 const results=useCatalogResource(signal=>catalog.search(selection,page,undefined,signal),'search:'+key+':'+page);
 const metadata=useCatalogResource(signal=>catalog.filters(signal),'filters');
 useEffect(()=>{const timer=setTimeout(()=>setSuggestionQuery(draft.q),250);return()=>clearTimeout(timer);},[draft.q]);
 const suggestions=useCatalogResource(signal=>catalog.suggestions(suggestionQuery,signal),'locations:'+suggestionQuery);
 const open=(kind:Editor)=>{
  setDraft(cancelSearchSelection(selection));setMin(selection.minPriceCents==null?'':(selection.minPriceCents/100).toFixed(2));setMax(selection.maxPriceCents==null?'':(selection.maxPriceCents/100).toFixed(2));setError('');setEditor(kind);
 };
 useEffect(()=>{if(params.entry==='criteria'||params.entry==='filters')open(params.entry);},[params.entry]);
 const cancel=()=>{setDraft(cancelSearchSelection(selection));setError('');setEditor(null);};
 const submit=()=>{
  let next:SearchSelection;
  try{next={...draft,minPriceCents:parseUsdCents(min),maxPriceCents:parseUsdCents(max)};}
  catch(e){setError(e instanceof Error?e.message:'Invalid price.');return;}
  const validation=validateSearchSelection(next,!!params.returnStayId);
  if(validation){setError(validation);return;}
  apply(next);setPagination({key:'',page:0});setEditor(null);
  if(params.returnStayId)router.replace({pathname:'/room/select',params:{id:params.returnStayId,...quoteSelectionParams({
   accommodationId:params.returnStayId,roomId:'',checkIn:next.checkIn,checkOut:next.checkOut,quantity:next.rooms,adults:next.adults,children:next.children
  })}});
 };
 const selector=(field:'typeIds'|'amenityIds',id:string)=>setDraft(d=>({...d,[field]:d[field].includes(id)?d[field].filter(v=>v!==id):d[field].length<20?[...d[field],id]:d[field]}));
 return <CatalogPage title="Find a stay" back action={<Action title="Edit" secondary onPress={()=>open('criteria')}/>}>
 <Text style={s.text}>{selection.locationLabel||selection.q||'All destinations'} · {selection.adults} adults · {selection.children} children · {selection.rooms} rooms</Text>
 {!!selection.checkIn&&<Text style={s.text}>{selection.checkIn} → {selection.checkOut}</Text>}
 <Action title="Filters and sort" secondary onPress={()=>open('filters')}/>
 {!!favorites.error&&<Text style={s.error}>{favorites.error}</Text>}
 <ResourceStatus {...results} retry={results.reload} empty={results.data?.items.length===0}/>
 {results.data&&<Text style={s.text}>{results.data.totalElements} stays · page {page+1} of {Math.max(1,results.data.totalPages)}</Text>}
 {results.data?.items.map(stay=><LiveStayCard key={stay.id} stay={stay}/>)}
 <View style={s.row}>{page>0&&<Action title="Previous" secondary onPress={()=>setPagination({key,page:page-1})}/>}
 {results.data&&page+1<results.data.totalPages&&<Action title="Next" onPress={()=>setPagination({key,page:page+1})}/>}</View>
 {editor!==null&&<Modal visible animationType="slide" onRequestClose={cancel}><SafeAreaView style={s.screen}>
 <View style={s.header}><Text style={s.title}>{editor==='criteria'?'Your stay':'Filters'}</Text><Action title="Cancel" secondary onPress={cancel}/></View>
 <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
 {editor==='criteria'?<>
 <Field label="Destination" value={draft.locationId?(draft.locationLabel||''):draft.q} onChange={q=>setDraft({...draft,q,locationId:undefined,locationLabel:undefined})} placeholder="City or property name"/>
 {suggestions.loading&&<Text style={s.text}>Finding destinations…</Text>}
 {!!suggestions.error&&<Text style={s.error}>{suggestions.error}</Text>}
 {!draft.locationId&&suggestions.data?.map(location=><Pressable key={location.id} style={s.chip} accessibilityRole="button" onPress={()=>setDraft({...draft,locationId:location.id,locationLabel:location.label,q:''})}><Text style={s.text}>{location.label}</Text></Pressable>)}
 {!!draft.locationId&&<Action title="Clear destination" secondary onPress={()=>setDraft({...draft,locationId:undefined,locationLabel:undefined,q:''})}/>}
 <SelectionFields value={draft} onChange={setDraft}/>
 </>:<>
 <Text style={s.text}>Price per room / night in USD. The backend calculates the final trip amount.</Text>
 <Field label="Minimum USD" value={min} numeric onChange={setMin}/><Field label="Maximum USD" value={max} numeric onChange={setMax}/>
 <ResourceStatus {...metadata} retry={metadata.reload}/>
 <Text style={s.heading}>Property types</Text><View style={s.row}>{metadata.data?.propertyTypes.map(t=><Pressable key={t.id} accessibilityRole="checkbox" accessibilityState={{checked:draft.typeIds.includes(t.id)}} onPress={()=>selector('typeIds',t.id)} style={[s.chip,draft.typeIds.includes(t.id)&&s.selected]}><Text style={s.text}>{t.name}</Text></Pressable>)}</View>
 <Text style={s.heading}>Amenities</Text><View style={s.row}>{metadata.data?.amenities.map(a=><Pressable key={a.id} accessibilityRole="checkbox" accessibilityState={{checked:draft.amenityIds.includes(a.id)}} onPress={()=>selector('amenityIds',a.id)} style={[s.chip,draft.amenityIds.includes(a.id)&&s.selected]}><Text style={s.text}>{a.name}</Text></Pressable>)}</View>
 <Text style={s.heading}>Minimum rating</Text><View style={s.row}>{[undefined,3,4,4.5,5].map(r=><Pressable key={r??'any'} style={[s.chip,draft.minRating===r&&s.selected]} accessibilityRole="radio" accessibilityState={{checked:draft.minRating===r}} onPress={()=>setDraft({...draft,minRating:r})}><Text style={s.text}>{r??'Any'}</Text></Pressable>)}</View>
 <Text style={s.heading}>Sort</Text><View style={s.row}>{(metadata.data?.sorts||[]).map(sort=><Pressable key={sort} style={[s.chip,draft.sort===sort&&s.selected]} accessibilityRole="radio" accessibilityState={{checked:draft.sort===sort}} onPress={()=>setDraft({...draft,sort})}><Text style={s.text}>{sort==='recommended'?'Featured':sort==='price'?'Price':sort==='rating'?'Rating':'Name'}</Text></Pressable>)}</View>
 <View style={s.row}>{(['asc','desc'] as const).map(direction=><Pressable key={direction} style={[s.chip,draft.direction===direction&&s.selected]} onPress={()=>setDraft({...draft,direction})} accessibilityRole="radio" accessibilityState={{checked:draft.direction===direction}}><Text style={s.text}>{direction==='asc'?'Ascending':'Descending'}</Text></Pressable>)}</View>
 </>}
 {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
 <Action title="Apply" onPress={submit}/>
 </ScrollView></SafeAreaView></Modal>}
 </CatalogPage>;
}
