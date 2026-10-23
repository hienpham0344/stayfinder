import React,{useEffect,useMemo,useState}from'react';import{ActivityIndicator,Image,KeyboardAvoidingView,Modal,Platform,ScrollView,Text,TextInput,View}from'react-native';import{useSafeAreaInsets}from'react-native-safe-area-context';
import{useSession}from'../../state/SessionProvider';import{ReviewEditor}from'../../state/reviewEditor';import{createReviewsApi}from'../../services/reviewsApi';import{createMediaApi}from'../../services/mediaApi';import{pickReviewPhoto,photoForm}from'../../services/reviewPhotoPicker';import type{ReviewDto}from'../../types/userFeatures';import{Action,catalogStyles as s}from'../catalog/CatalogUi';import{COLORS}from'../../constants/tokens';
export type ReviewSource={stayId:string;bookingId?:string;review?:ReviewDto};
function Photo({url,onRemove,busy}:{url:string;onRemove:()=>void;busy:boolean}){
 const{api}=useSession();const[failed,setFailed]=useState(false);let uri:string|undefined;try{uri=api.mediaUrl(url);}catch{}
 return <View style={{width:140,gap:8}}>{uri&&!failed?<Image source={{uri}} style={{width:140,height:100,borderRadius:12}} accessibilityLabel="Review photo" onError={()=>setFailed(true)}/>:<Text style={s.error}>Photo unavailable. Refresh the review to renew its link.</Text>}<Action title="Remove photo" secondary disabled={busy} onPress={onRemove}/></View>;
}
export function ReviewComposer({source,onClose,onSaved}:{source:ReviewSource;onClose:()=>void;onSaved:()=>void}){
 const{api,user,session}=useSession(),insets=useSafeAreaInsets();const[setupError,setSetupError]=useState('');
 const editor=useMemo(()=>new ReviewEditor(createReviewsApi(api),{pick:pickReviewPhoto,upload:photo=>createMediaApi(api).upload(photoForm(photo))},createMediaApi(api)),[api,user?.id,source.bookingId,source.review?.id]);
 const[,render]=useState(0);
 useEffect(()=>{const off=editor.subscribe(()=>render(n=>n+1));try{if(user)editor.start(user.id,source);}catch(e){setSetupError(e instanceof Error?e.message:'Unable to open review.');}return()=>{off();editor.clear();};},[editor]);
 const state=editor.snapshot(),busy=state.busy;
 const save=async()=>{const generation=session.getGeneration();try{await editor.submit();if(generation===session.getGeneration())onSaved();}catch{}};
 const close=async()=>{if(busy)return;await editor.discard();onClose();};
 return <Modal visible transparent animationType="fade" onRequestClose={()=>void close()}><KeyboardAvoidingView style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)'}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:20,paddingTop:24+insets.top,paddingBottom:24+insets.bottom}}><View style={[s.cardBody,{backgroundColor:COLORS.bgWhite,borderRadius:24,gap:16}]}>
 <Text style={s.heading}>{source.review?'Edit your review':'Review your stay'}</Text><Text style={s.text}>Your review is linked to this completed booking. Add up to five JPEG, PNG or WebP photos, at most 5 MiB each.</Text>
 {!user?<Text style={s.error}>Sign in to write a review.</Text>:null}{setupError?<Text style={s.error}>{setupError}</Text>:null}
 <View style={s.row}>{[1,2,3,4,5].map(rating=><Action key={rating} title={rating+' ★'} secondary={state.rating!==rating} disabled={busy} onPress={()=>editor.setText(rating,state.comment)}/>)}</View>
 <Text style={s.text}>Comment (optional, up to 2000 characters)</Text><TextInput accessibilityLabel="Review comment" multiline maxLength={2000} editable={!busy} value={state.comment} onChangeText={value=>editor.setText(state.rating,value)} style={[s.field,{minHeight:120,textAlignVertical:'top',paddingTop:12}]}/>
 <ScrollView horizontal contentContainerStyle={{gap:12}}>{state.photos.map(photo=><Photo key={photo.id} url={photo.displayUrl} busy={busy} onRemove={()=>void editor.removePhoto(photo.id).catch(()=>{})}/>)}</ScrollView>
 {busy?<ActivityIndicator color={COLORS.primary}/>:null}{state.error?<Text style={s.error} accessibilityRole="alert">{state.error} Refresh reviews to check whether a submission was saved before retrying.</Text>:null}
 <Action title="Add photo" secondary disabled={busy||state.photos.length>=5||!!setupError} onPress={()=>void editor.addPhoto().catch(()=>{})}/>
 <Action title="Save review" disabled={busy||!user||!!setupError} onPress={()=>void save()}/><Action title="Cancel review" secondary disabled={busy} onPress={()=>void close()}/>
 </View></ScrollView></KeyboardAvoidingView></Modal>;
}
