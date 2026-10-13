import React,{useEffect,useState}from'react';
import{ActivityIndicator,Image,KeyboardAvoidingView,Modal,Platform,Pressable,ScrollView,StyleSheet,Text,TextInput,View,ViewStyle,Switch}from'react-native';
import{router}from'expo-router';import{useSafeAreaInsets}from'react-native-safe-area-context';
import{ArrowLeft,CalendarDays,ChevronRight,CircleHelp,Globe2,Heart,LogOut,Settings,Star,Wallet}from'lucide-react-native';
import{COLORS,RADII,SHADOWS,SIZES,SPACING,TYPOGRAPHY}from'../../constants/tokens';
import{useProfile}from'../../state/ProfileProvider';import{useSession}from'../../state/SessionProvider';import{useRewards}from'../../state/RewardsProvider';
import type{Preferences,SupportReportRequest}from'../../types/userFeatures';
type Dialog='edit'|'settings'|'password'|'email'|'report'|'language'|'logout'|null;
const languages={'en-US':'English (US)','vi-VN':'Tiếng Việt','fr-FR':'Français'} as const;
const categories:SupportReportRequest['category'][]=['Booking','Payment','Account','Rewards','Other'];
function MenuRow({title,icon:Icon,onPress,value}:{title:string;icon:typeof Heart;onPress:()=>void;value?:string}){
 return <Pressable style={styles.menuRow} onPress={onPress} accessibilityRole="button" accessibilityLabel={value?title+', '+value:title}><View style={styles.menuIcon}><Icon size={22} color={COLORS.primary}/></View><Text style={styles.menuText}>{title}</Text>{value?<Text style={[styles.menuValue,{maxWidth:'35%'}]}>{value}</Text>:null}<ChevronRight size={20} color={COLORS.inkSubtle}/></Pressable>;
}
function Field({label,value,onChange,secure=false,multiline=false,maxLength,keyboardType}:{label:string;value:string;onChange:(v:string)=>void;secure?:boolean;multiline?:boolean;maxLength?:number;keyboardType?:'email-address'|'phone-pad'}){
 return <View style={styles.formTile}><Text style={styles.formLabel}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} secureTextEntry={secure} multiline={multiline} maxLength={maxLength} autoCapitalize={secure||keyboardType==='email-address'?'none':'sentences'} keyboardType={keyboardType} style={[styles.formInput,multiline&&{minHeight:100,textAlignVertical:'top'}]}/></View>;
}
export function ProfileExperience(){
 const insets=useSafeAreaInsets(),{store,state}=useProfile(),{user,session,authApi}=useSession(),{store:rewardsStore,state:rewards,ready}=useRewards();
 const[dialog,setDialog]=useState<Dialog>(null),[draftName,setDraftName]=useState(''),[draftPhone,setDraftPhone]=useState(''),[draftEmail,setDraftEmail]=useState(''),[currentPassword,setCurrentPassword]=useState(''),[newPassword,setNewPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[draftNotifications,setDraftNotifications]=useState(true),[category,setCategory]=useState<SupportReportRequest['category']>('Booking'),[description,setDescription]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState(''),[authBusy,setAuthBusy]=useState(false);
 const profile=state.profile,name=profile?.fullName??user?.fullName??'Sign in',email=profile?.email??user?.email??'',locale=state.preferences?.language??'en-US',busy=state.busy||state.loading||authBusy;
 const close=()=>{setDialog(null);setCurrentPassword('');setNewPassword('');setConfirmPassword('');setError('');};
 useEffect(()=>{close();setNotice('');setDescription('');setAuthBusy(false);},[user?.id]);
 useEffect(()=>{if(ready&&user)void rewardsStore.load().catch(()=>{});},[ready,rewardsStore,user?.id]);
 const open=(next:Dialog)=>{if(!user){router.push('/auth/demo');return;}setError('');setNotice('');setDialog(next);setCurrentPassword('');setNewPassword('');setConfirmPassword('');
  if(next==='edit'){setDraftName(name);setDraftPhone(profile?.phone??'');}
  if(next==='email')setDraftEmail(email);
  if(next==='settings')setDraftNotifications(state.preferences?.bookingNotifications??true);
  if(next==='report'){setCategory(state.pendingReport?.body.category??'Booking');setDescription(state.pendingReport?.body.description??'');}
 };
 const action=async(job:()=>Promise<string>)=>{if(busy)return;const generation=session.getGeneration();setAuthBusy(true);setError('');setNotice('');
  try{const message=await job();if(generation===session.getGeneration()){close();setNotice(message);}}
  catch(e){if(generation===session.getGeneration())setError(e instanceof Error?e.message:'Unable to save. Please retry.');}
  finally{if(generation===session.getGeneration())setAuthBusy(false);}
 };
 const save=()=>{
  if(!draftName.trim()||draftName.trim().length>100){setError('Enter a name of 1–100 characters.');return;}
  void action(async()=>{await store.save({fullName:draftName.trim(),phone:draftPhone.trim()||null});return 'Your profile was saved.';});
 };
 const changePassword=()=>{
  if(!currentPassword||newPassword.length<8||newPassword!==confirmPassword){setError('Enter your current password and a matching new password of at least 8 characters.');return;}
  void action(async()=>{await authApi.changePassword({currentPassword,newPassword});session.clearUserState();close();router.replace('/auth/demo?reason=password-changed' as never);return '';});
 };
 const changeEmail=()=>{
  if(!currentPassword||!/^\S+@\S+\.\S+$/.test(draftEmail.trim())){setError('Enter a valid new email and your current password.');return;}
  void action(async()=>{await authApi.changeEmail({currentPassword,newEmail:draftEmail.trim()});session.clearUserState();close();router.replace('/auth/demo?reason=email-changed' as never);return '';});
 };
 const report=()=>{
  if(!description.trim()||description.length>5000){setError('Describe the issue in 1–5000 characters.');return;}
  void action(async()=>{const r=await store.report({category,description:description.trim(),bookingId:null});setDescription('');return 'Report '+r.reportId+' was submitted.';});
 };
 const submit=(title:string,onPress:()=>void)=><Pressable style={[styles.submitButton,busy&&{opacity:0.5}]} disabled={busy} onPress={onPress} accessibilityRole="button"><Text style={styles.submitText}>{busy?'Please wait…':title}</Text></Pressable>;
 return <View style={[styles.screen,{paddingTop:insets.top}]}><View style={styles.header}><Pressable style={styles.back} onPress={()=>router.replace('/')} accessibilityLabel="Back to home"><ArrowLeft size={20} color={COLORS.primary}/></Pressable><Text style={styles.brand}>StayFinder</Text><View style={styles.back}/></View>
 <ScrollView contentContainerStyle={[styles.content,{paddingBottom:100+insets.bottom}]} keyboardShouldPersistTaps="handled">
 <View style={styles.profileCard}><View style={styles.avatarShadow}>{profile?.avatarUrl?<Image source={{uri:profile.avatarUrl}} style={styles.avatar}/>:<View style={[styles.avatar,{alignItems:'center',justifyContent:'center',backgroundColor:COLORS.surfaceMint}]}><Text style={styles.name}>{name.slice(0,1)}</Text></View>}</View><View style={styles.profileInfo}><Text style={styles.name} numberOfLines={1}>{name}</Text><Text style={styles.email} numberOfLines={1}>{email}</Text><Pressable style={[styles.editButton,{minHeight:44}]} disabled={busy} onPress={()=>open('edit')}><Text style={styles.editText}>{user?'Edit Profile':'Sign in'}</Text></Pressable></View></View>
 {state.loading?<ActivityIndicator color={COLORS.primary}/>:null}{notice?<Text style={styles.notice}>{notice}</Text>:null}{state.error?<Text accessibilityRole="alert" style={styles.error}>{state.error}</Text>:null}{!dialog&&error?<Text style={styles.error}>{error}</Text>:null}
 <Pressable style={{minHeight:44,justifyContent:'center'}} disabled={busy} onPress={()=>void store.load()}><Text style={styles.editText}>Refresh profile</Text></Pressable>
 <Pressable style={styles.rewardCard} onPress={()=>router.push('/rewards')} accessibilityLabel="View rewards wallet"><View pointerEvents="none" style={styles.rewardGlow}/><View style={styles.rewardTop}><Text style={styles.rewardLabel}>StayFinder Rewards</Text><Star size={20} color={COLORS.primaryLight}/></View><View style={styles.pointsLine}><Text style={styles.points}>{rewards.wallet?rewards.wallet.availablePoints.toLocaleString(locale):'—'}</Text><Text style={styles.pointsUnit}>pts</Text></View><View style={styles.walletButton}><Text style={styles.walletText}>View Wallet</Text><ChevronRight size={14} color={COLORS.primary}/></View></Pressable>
 <View style={styles.menuCard}><MenuRow title="My Bookings" icon={CalendarDays} onPress={()=>router.push('/(tabs)/bookings')}/><MenuRow title="Wishlist" icon={Heart} onPress={()=>router.push('/(tabs)/wishlist')}/><MenuRow title="Rewards Wallet" icon={Wallet} onPress={()=>router.push('/rewards')}/><MenuRow title="Language" icon={Globe2} value={languages[locale]} onPress={()=>open('language')}/><MenuRow title="Settings" icon={Settings} onPress={()=>open('settings')}/><MenuRow title="Report an Issue" icon={CircleHelp} onPress={()=>open('report')}/></View>
 {user?<Pressable style={styles.signedOutButton} onPress={()=>open('logout')}><LogOut size={18} color={COLORS.validation}/><Text style={styles.signedOutText}>Log Out</Text></Pressable>:null}</ScrollView>
 <Modal visible={dialog!==null} transparent animationType="fade" onRequestClose={()=>{if(!busy)close();}}><KeyboardAvoidingView style={[styles.modalBackdrop,{backgroundColor:'rgba(0,0,0,0.45)'}]} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={[styles.modalCenter,{paddingTop:24+insets.top,paddingBottom:24+insets.bottom}]} keyboardShouldPersistTaps="handled"><View style={styles.modalCard}>
 {dialog==='edit'?<><Text style={styles.modalTitle}>Edit profile</Text><Text style={styles.modalHint}>Update your name and phone.</Text><Field label="Full name" value={draftName} onChange={setDraftName} maxLength={100}/><Field label="Phone" value={draftPhone} onChange={setDraftPhone} keyboardType="phone-pad" maxLength={16}/>{submit('Save changes',save)}</>:null}
 {dialog==='settings'?<><Text style={styles.modalTitle}>Settings</Text><View style={styles.settingRow}><Text style={styles.notificationLabel}>Booking notifications</Text><Switch value={draftNotifications} onValueChange={setDraftNotifications} disabled={busy} accessibilityLabel="Booking notifications"/></View><Pressable style={styles.settingRow} onPress={()=>open('password')} disabled={busy}><Text style={styles.settingText}>Change password</Text><ChevronRight size={20}/></Pressable><Pressable style={styles.settingRow} onPress={()=>open('email')} disabled={busy}><Text style={styles.settingText}>Change email</Text><ChevronRight size={20}/></Pressable>{submit('Save settings',()=>void action(async()=>{await store.savePreferences({bookingNotifications:draftNotifications});return 'Settings were saved.';}))}</>:null}
 {dialog==='language'?<><Text style={styles.modalTitle}>Language</Text><Text style={styles.modalHint}>Controls number and date formatting. Screen labels remain in English.</Text>{(Object.keys(languages) as Preferences['language'][]).map(value=><Pressable key={value} style={styles.choiceRow} disabled={busy} onPress={()=>void action(async()=>{await store.savePreferences({language:value});return 'Formatting preference saved.';})}><Text style={styles.choiceText}>{languages[value]}{locale===value?' ✓':''}</Text></Pressable>)}</>:null}
 {dialog==='password'?<><Text style={styles.modalTitle}>Change password</Text><Text style={styles.modalHint}>Sign in again after saving.</Text><Field label="Current password" value={currentPassword} onChange={setCurrentPassword} secure/><Field label="New password" value={newPassword} onChange={setNewPassword} secure/><Field label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} secure/>{submit('Change password',changePassword)}</>:null}
 {dialog==='email'?<><Text style={styles.modalTitle}>Change email</Text><Text style={styles.modalHint}>Sign in again after saving.</Text><Field label="New email" value={draftEmail} onChange={setDraftEmail} keyboardType="email-address" maxLength={254}/><Field label="Current password" value={currentPassword} onChange={setCurrentPassword} secure/>{submit('Change email',changeEmail)}</>:null}
 {dialog==='report'?<><Text style={styles.modalTitle}>Report an issue</Text><Text style={styles.modalHint}>Choose a category and describe the issue. Reports are saved in the app.</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:16}}>{categories.map(c=><Pressable key={c} style={[styles.editButton,{minHeight:44,width:'auto',paddingHorizontal:12},category===c&&{borderColor:COLORS.primary}]} disabled={!!state.pendingReport||busy} onPress={()=>setCategory(c)}><Text style={styles.editText}>{c}</Text></Pressable>)}</View><Field label="Description" value={description} onChange={state.pendingReport?()=>{}:setDescription} multiline maxLength={5000}/>{state.pendingReport?<Text style={styles.modalHint}>Retry with the same details to recover the pending report.</Text>:null}{submit(state.pendingReport?'Retry report':'Submit report',report)}</>:null}
 {dialog==='logout'?<><Text style={styles.modalTitle}>Log out?</Text><Text style={styles.modalHint}>Sign in again to view your saved bookings and rewards.</Text>{submit('Log out',()=>void action(async()=>{await session.logout();router.replace('/auth/demo?mode=signed-out' as never);return '';}))}</>:null}
 {error?<Text accessibilityRole="alert" style={[styles.error,{marginTop:12}]}>{error}</Text>:null}<Pressable style={styles.cancelButton} disabled={busy} onPress={close}><Text style={styles.cancelText}>Cancel</Text></Pressable>
 </View></ScrollView></KeyboardAvoidingView></Modal></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgMain },
  header: { height: SIZES.appBar, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  back: { width: SIZES.iconButton, height: SIZES.iconButton, alignItems: 'center', justifyContent: 'center' },
  brand: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: 24, paddingBottom: 100 },
  profileCard: { minHeight: 120, padding: 15, borderRadius: RADII.promo, borderWidth: 1, borderColor: '#E0ECE7', backgroundColor: COLORS.bgWhite, flexDirection: 'row', alignItems: 'center', gap: 14, ...Platform.select<ViewStyle>({ web: { boxShadow: '0px 6px 9px rgba(5,36,31,0.07)' }, default: SHADOWS.cardSoft }) },
  avatarShadow: { width: 72, height: 72, borderRadius: RADII.full, backgroundColor: COLORS.bgWhite, ...Platform.select({ web: { boxShadow: '0px 3px 8px rgba(0,0,0,0.07)' }, default: { shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 } }) },
  avatar: { width: 72, height: 72, borderRadius: RADII.full, borderWidth: 2, borderColor: '#D6E5E0' },
  profileInfo: { flex: 1, minWidth: 0, height: 88, alignItems: 'flex-start', gap: 4 },
  name: { color: '#141F1C', fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 24 },
  email: { height: 22, color: '#667873', fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 18 },
  editButton: { width: 116, height: 34, marginTop: 0, borderRadius: RADII.full, borderWidth: 1, borderColor: '#CCE3DB', backgroundColor: '#EDF7F4', alignItems: 'center', justifyContent: 'center' },
  editText: { color: COLORS.primary, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 13, lineHeight: 20 },
  notice: { marginTop: 12, color: COLORS.actionTeal, fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 18 },
  rewardCard: { height: 144, marginTop: 20, padding: 16, borderRadius: RADII.promo, overflow: 'hidden', backgroundColor: '#066E62', ...Platform.select<ViewStyle>({ web: { boxShadow: '0px 8px 22px rgba(3,41,33,0.13)' }, default: SHADOWS.cardSoft }) },
  rewardGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: RADII.full, backgroundColor: COLORS.primaryHover, opacity: 0.72, ...(Platform.OS === 'web' ? { filter: 'blur(20px)' } as ViewStyle : {}) },
  rewardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardLabel: { color: COLORS.primarySoft, opacity: 0.9, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  pointsLine: { height: 48, flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  points: { color: '#C7FFF5', fontFamily: TYPOGRAPHY.families.semibold, fontSize: 32, lineHeight: 40, letterSpacing: -0.64 },
  pointsUnit: { color: '#C7FFF5', opacity: 0.8, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  walletButton: { height: 36, alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 16, borderRadius: RADII.full, backgroundColor: '#D1FFF5', flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletText: { color: COLORS.primaryActive, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  menuCard: { marginTop: 20, paddingHorizontal: 15, paddingVertical: 7, borderRadius: RADII.promo, borderWidth: 1, borderColor: '#E0ECE7', backgroundColor: COLORS.bgWhite, ...Platform.select<ViewStyle>({ web: { boxShadow: '0px 6px 18px rgba(5,36,31,0.07)' }, default: SHADOWS.cardSoft }) },
  menuRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuIcon: { width: 36, height: 36, borderRadius: RADII.full, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfaceMint, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 24 },
  menuValue: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 20 },
  signedOutButton: { height: SIZES.button, marginTop: 20, borderRadius: 20, borderWidth: 1, borderColor: '#F2C7BD', backgroundColor: '#FFF5F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  signedOutText: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14, lineHeight: 20 },
  settingRow: { minHeight: 64, marginBottom: 16, paddingHorizontal: 16, borderRadius: SPACING.md, backgroundColor: COLORS.surfaceSage, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notificationLabel: { flexShrink: 1, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  notificationToggle: { minWidth: 50, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  changePasswordRow: { minHeight: 56, borderWidth: 1, borderColor: '#DBE8E3', borderRadius: 14, backgroundColor: '#F4FAF8' },
  settingText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 20 },
  settingHint: { color: '#6E807A', fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, lineHeight: 14 },
  sheetPrimaryButton: { height: 44, borderRadius: 12, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  settingsSubmitText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  settingsCancelButton: { height: 44, marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  settingsCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22 },
  categoryRow: { minHeight: 48, paddingHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: '#DBE8E3', backgroundColor: COLORS.surfacePale, justifyContent: 'center' },
  choiceRow: { height: 52, paddingHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#DFEBE7', borderRadius: 14, backgroundColor: '#F4FAF8', justifyContent: 'center' },
  lastChoiceRow: { marginBottom: 0 },
  choiceText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 20 },
  contextRoot: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.35)' },
  contextCard: { position: 'absolute', top: 220, left: 20, right: 20, padding: 24, gap: 16, borderRadius: 24, backgroundColor: COLORS.bgWhite, alignItems: 'center' },
  contextTitle: { width: '100%', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, textAlign: 'center' },
  contextDescription: { width: '100%', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  contextConfirm: { width: '100%', height: 48, borderRadius: 24, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  contextConfirmText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  contextCancel: { width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' },
  contextCancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#191919' },
  sheetCard: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, borderTopLeftRadius: RADII.promo, borderTopRightRadius: RADII.promo, backgroundColor: COLORS.bgWhite, ...Platform.select<ViewStyle>({ web: { boxShadow: '0px -7px 26px rgba(5,41,33,0.08)' }, default: { shadowColor: '#052921', shadowOffset: { width: 0, height: -7 }, shadowOpacity: 0.08, shadowRadius: 13, elevation: 14 } }) },
  categorySheetCard: { ...Platform.select<ViewStyle>({ web: { boxShadow: '0px -7px 26px rgba(5,31,26,0.10)' }, default: { shadowColor: '#051F1A', shadowOpacity: 0.10 } }) },
  sheetTitle: { marginBottom: 16, color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28 },
  modalBackdrop: { flex: 1, backgroundColor: '#191919' },
  modalCenter: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 },
  modalCard: { padding: 24, borderRadius: RADII.promo, backgroundColor: COLORS.bgWhite, ...Platform.select<ViewStyle>({ web: { boxShadow: '0px 10px 28px rgba(5,31,26,0.12)' }, default: { shadowColor: '#051F1A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 12 } }) },
  editModalCard: { minHeight: 398 },
  tallModalCard: { minHeight: 456 },
  modalTitle: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  modalHint: { marginTop: 14, marginBottom: 14, color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  formTile: { minHeight: 64, marginBottom: 14, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderTealSoft, backgroundColor: COLORS.surfaceMint, justifyContent: 'center' },
  formLabel: { color: COLORS.inkSubtle, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11 },
  formInput: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13, padding: 0, minHeight: 28, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as unknown as ViewStyle : {}) },
  editFormTile: { borderColor: '#DBE8E3', backgroundColor: '#F4FAF8', gap: 2 },
  editFormLabel: { fontSize: 12, lineHeight: 16 },
  editFormInput: { height: 22, minHeight: 22, padding: 0, borderWidth: 0, borderColor: 'transparent', backgroundColor: 'transparent', color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14, lineHeight: 22, ...(Platform.OS === 'web' ? { outlineWidth: 0, outlineColor: 'transparent' } : {}) },
  editSubmitText: { lineHeight: 20 },
  editCancelButton: { marginTop: 14 },
  editCancelText: { lineHeight: 20 },
  formValue: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 13 },
  categoryValue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 },
  descriptionInput: { minHeight: 90, textAlignVertical: 'top', paddingTop: 32 },
  reportDescriptionTile: { height: 124, paddingVertical: 12, gap: 6 },
  reportCategoryTile: { height: 68, minHeight: 68 },
  reportDescriptionLabel: { color: '#42544F', fontFamily: TYPOGRAPHY.families.medium, fontSize: 12, lineHeight: 16 },
  error: { color: COLORS.validation, fontFamily: TYPOGRAPHY.families.regular, fontSize: 11, marginBottom: 12 },
  submitButton: { height: 48, borderRadius: RADII.full, backgroundColor: COLORS.primaryActive, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: COLORS.bgWhite, fontFamily: TYPOGRAPHY.families.semibold, fontSize: 14 },
  cancelButton: { height: 44, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: COLORS.inkNavy, fontFamily: TYPOGRAPHY.families.medium, fontSize: 14 },
});
