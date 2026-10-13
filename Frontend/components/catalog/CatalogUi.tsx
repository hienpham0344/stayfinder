import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { ArrowLeft, Heart, ImageOff, Star } from 'lucide-react-native';
import { COLORS, RADII, TYPOGRAPHY } from '../../constants/tokens';
import { useSession } from '../../state/SessionProvider';
import { useFavorites } from '../../state/FavoritesProvider';
import{useUsdFormatter}from'../../state/useUsdFormatter';
import type { StayCardModel } from '../../types/stay';
import type { SearchSelection } from '../../state/searchSelection';
export const catalogStyles=StyleSheet.create({
 screen:{flex:1,backgroundColor:COLORS.bgMain},body:{padding:20,paddingBottom:32,gap:16},
 header:{paddingHorizontal:16,minHeight:60,flexDirection:'row',alignItems:'center',gap:8},
 title:{fontFamily:TYPOGRAPHY.families.bold,fontSize:24,color:COLORS.dark,flex:1},
 heading:{fontFamily:TYPOGRAPHY.families.semibold,fontSize:20,color:COLORS.dark},
 text:{fontFamily:TYPOGRAPHY.families.regular,fontSize:14,lineHeight:22,color:COLORS.textSecondary},
 price:{fontFamily:TYPOGRAPHY.families.bold,fontSize:18,color:COLORS.dark},
 row:{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap'},
 action:{minHeight:48,minWidth:48,paddingHorizontal:18,borderRadius:RADII.full,backgroundColor:COLORS.primary,justifyContent:'center',alignItems:'center'},
 actionText:{fontFamily:TYPOGRAPHY.families.semibold,color:'white',fontSize:14},
 secondary:{backgroundColor:COLORS.bgSecondary},secondaryText:{color:COLORS.primary},
 field:{borderWidth:1,borderColor:COLORS.borderDefault,borderRadius:16,minHeight:48,paddingHorizontal:12,color:COLORS.dark,backgroundColor:'white',fontFamily:TYPOGRAPHY.families.regular},
 fieldBox:{gap:6,flexGrow:1},card:{backgroundColor:'white',borderWidth:1,borderColor:COLORS.borderLight,borderRadius:24,overflow:'hidden'},
 image:{height:180,width:'100%',backgroundColor:COLORS.bgSecondary},cardBody:{padding:16,gap:6},
 icon:{width:48,height:48,alignItems:'center',justifyContent:'center'},
 heart:{position:'absolute',top:12,right:12,backgroundColor:'white',borderRadius:24},
 error:{color:'#A32929',fontFamily:TYPOGRAPHY.families.regular,fontSize:14,lineHeight:22},
 chip:{paddingHorizontal:14,minHeight:44,justifyContent:'center',borderWidth:1,borderColor:COLORS.borderDefault,borderRadius:22},
 selected:{backgroundColor:COLORS.bgSecondary,borderColor:COLORS.primary},center:{alignItems:'center',justifyContent:'center',gap:12,padding:24},
});
export function Action({title,onPress,disabled=false,secondary=false}:{title:string;onPress:()=>void;disabled?:boolean;secondary?:boolean}){
 return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[catalogStyles.action,secondary&&catalogStyles.secondary,disabled&&{opacity:0.5}]}><Text style={[catalogStyles.actionText,secondary&&catalogStyles.secondaryText]}>{title}</Text></Pressable>;
}
export function CatalogPage({title,children,back=false,action}:{title:string;children:React.ReactNode;back?:boolean;action?:React.ReactNode}){
 return <SafeAreaView style={catalogStyles.screen} edges={['top','left','right']}><View style={catalogStyles.header}>{back&&<Pressable accessibilityLabel="Go back" style={catalogStyles.icon} onPress={()=>router.canGoBack()?router.back():router.replace('/')}><ArrowLeft color={COLORS.primary}/></Pressable>}<Text style={catalogStyles.title}>{title}</Text>{action}</View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={catalogStyles.body}>{children}</ScrollView></SafeAreaView>;
}
export function ResourceStatus({loading,error,empty,retry,emptyText='No stays found. Try changing your search.'}:{loading:boolean;error:string;empty?:boolean;retry:()=>void;emptyText?:string}){
 if(loading)return <View style={catalogStyles.center}><ActivityIndicator color={COLORS.primary}/><Text style={catalogStyles.text}>Loading…</Text></View>;
 if(error)return <View style={catalogStyles.center}><Text accessibilityRole="alert" style={catalogStyles.error}>{error}</Text><Action title="Retry" onPress={retry}/></View>;
 if(empty)return <View style={catalogStyles.center}><Text style={catalogStyles.text}>{emptyText}</Text></View>;
 return null;
}
export function Field({label,value,onChange,numeric=false,placeholder}:{label:string;value:string;onChange:(s:string)=>void;numeric?:boolean;placeholder?:string}){
 return <View style={catalogStyles.fieldBox}><Text style={catalogStyles.text}>{label}</Text><TextInput accessibilityLabel={label} style={catalogStyles.field} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={COLORS.textMuted} keyboardType={numeric?'decimal-pad':'default'} autoCapitalize="none"/></View>;
}
export function StayImage({url,title}:{url:string|null;title:string}){
 const [failed,setFailed]=useState(false);
 return url&&!failed?<Image source={{uri:url}} accessibilityLabel={title} style={catalogStyles.image} resizeMode="cover" onError={()=>setFailed(true)}/>:<View style={[catalogStyles.image,catalogStyles.center]}><ImageOff color={COLORS.textMuted}/><Text style={catalogStyles.text}>Photo unavailable</Text></View>;
}
export function FavoriteButton({stay}:{stay:StayCardModel}){
 const {user}=useSession(),{store,state}=useFavorites(),path=usePathname();
 const saved=store.isSaved(stay.id,stay.isFavorite);
 return <Pressable style={[catalogStyles.icon,catalogStyles.heart]} disabled={state.busy.has(stay.id)} accessibilityRole="button" accessibilityLabel={saved?'Remove from wishlist':'Save to wishlist'} accessibilityState={{disabled:state.busy.has(stay.id)}} onPress={()=>{
  if(!user){router.push({pathname:'/auth/demo',params:{mode:'login',returnTo:path}});return;}
  void store.toggle(stay);
 }}><Heart size={22} color={saved?'#FF5285':COLORS.primary} fill={saved?'#FF5285':'transparent'}/></Pressable>;
}
export function LiveStayCard({stay}:{stay:StayCardModel}){
 const formatUsd=useUsdFormatter();
 return <View style={catalogStyles.card}><Pressable accessibilityRole="button" accessibilityLabel={'View '+stay.title} onPress={()=>router.push({pathname:'/room/[id]',params:{id:stay.id}})}>
 <StayImage key={stay.imageUrl} url={stay.imageUrl} title={stay.title}/><View style={catalogStyles.cardBody}><Text style={catalogStyles.heading}>{stay.title}</Text>
 {stay.locationLabel&&<Text style={catalogStyles.text}>{stay.locationLabel}</Text>}
 <View style={catalogStyles.row}>{stay.rating!=null?<><Star size={14} color={COLORS.starGold}/><Text style={catalogStyles.text}>{stay.rating.toFixed(1)} · {stay.reviewCount} reviews</Text></>:<Text style={catalogStyles.text}>No reviews yet</Text>}</View>
 <Text style={catalogStyles.price}>{formatUsd(stay.nightlyPrice)} <Text style={catalogStyles.text}>/ room / night</Text></Text></View></Pressable><FavoriteButton stay={stay}/></View>;
}
export function SelectionFields({value,onChange}:{value:SearchSelection;onChange:(s:SearchSelection)=>void}){
 const count=(key:'adults'|'children'|'rooms',label:string,min:number,max:number)=><View style={[catalogStyles.row,{justifyContent:'space-between'}]}><Text style={catalogStyles.text}>{label}: {value[key]}</Text><View style={catalogStyles.row}><Action title="−" secondary disabled={value[key]<=min} onPress={()=>onChange({...value,[key]:value[key]-1})}/><Action title="+" secondary disabled={value[key]>=max} onPress={()=>onChange({...value,[key]:value[key]+1})}/></View></View>;
 return <View style={{gap:12}}><Field label="Check-in (YYYY-MM-DD)" value={value.checkIn} onChange={checkIn=>onChange({...value,checkIn})} placeholder="YYYY-MM-DD"/><Field label="Check-out (YYYY-MM-DD)" value={value.checkOut} onChange={checkOut=>onChange({...value,checkOut})} placeholder="YYYY-MM-DD"/>
 {count('adults','Adults',1,20)}{count('children','Children',0,20)}{count('rooms','Rooms',1,10)}</View>;
}
