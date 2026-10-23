import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { HomeHeader } from '../../components/home/HomeHeader';
import { CategoryScroll } from '../../components/home/CategoryScroll';
import { Action, LiveStayCard, ResourceStatus, catalogStyles as s } from '../../components/catalog/CatalogUi';
import { useCatalog, useCatalogResource } from '../../state/CatalogProvider';
import { useFavorites } from '../../state/FavoritesProvider';
import {useNotifications}from'../../state/NotificationsProvider';
export default function HomeScreen(){
 const {state:inbox}=useNotifications();
 const {catalog,selection,apply}=useCatalog();const {state:favorites}=useFavorites();
 const [typeId,setTypeId]=useState('');
 const metadata=useCatalogResource(signal=>catalog.filters(signal),'filters');
 const criteria={...selection,typeIds:typeId?[typeId]:[]};
 const key=JSON.stringify(criteria);
 const recommended=useCatalogResource(signal=>catalog.search(criteria,0,'recommended',signal),'home-recommended:'+key);
 const popular=useCatalogResource(signal=>catalog.search(criteria,0,'popular',signal),'home-popular:'+key);
 const seeAll=()=>{apply(criteria);router.push('/search');};
 return <SafeAreaView style={s.screen} edges={['top','left','right']}><HomeHeader unreadCount={inbox.unreadCount} onNotificationPress={()=>router.push('/notifications')} locationName={selection.locationLabel||selection.q||'Choose destination'}
 onSearchPress={()=>router.push('/search?entry=criteria')} onFilterPress={()=>router.push('/search?entry=filters')} onLocationPress={()=>router.push('/search?entry=criteria')}/>
 <ScrollView contentContainerStyle={{paddingBottom:32}}><View style={s.body}><Text style={s.heading}>Find your next stay</Text><Text style={s.text}>Explore places to stay and compare demo prices for your selected room and dates.</Text><Action title="Search stays" onPress={seeAll}/></View>
 {metadata.data&&<CategoryScroll selectedCategory={typeId} items={[{id:'',name:'All',iconName:'Building2'},...metadata.data.propertyTypes.map(t=>({...t,iconName:'Building2'}))]} onSelectCategory={setTypeId}/>}
 {!!metadata.error&&<View style={{paddingHorizontal:20}}><Text style={s.error}>{metadata.error}</Text><Action title="Retry categories" secondary onPress={metadata.reload}/></View>}
 <View style={s.body}>{!!favorites.error&&<Text accessibilityRole="alert" style={s.error}>{favorites.error}</Text>}
 <View style={s.row}><Text style={s.heading}>Featured stays</Text><Action title="See all" secondary onPress={seeAll}/></View>
 <ResourceStatus {...recommended} retry={recommended.reload} empty={recommended.data?.items.length===0}/>
 {recommended.data?.items.slice(0,4).map(stay=><LiveStayCard key={stay.id} stay={stay}/>)}
 <Text style={s.heading}>Popular stays</Text><ResourceStatus {...popular} retry={popular.reload} empty={popular.data?.items.length===0}/>
 {popular.data?.items.slice(0,4).map(stay=><LiveStayCard key={stay.id} stay={stay}/>)}
 </View></ScrollView></SafeAreaView>;
}
