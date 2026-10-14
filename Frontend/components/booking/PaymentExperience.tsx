import React,{useEffect,useState}from'react';import{Image,Text,View}from'react-native';import{router}from'expo-router';
import{Action,CatalogPage,Field,ResourceStatus,catalogStyles as s}from'../catalog/CatalogUi';import{useSession}from'../../state/SessionProvider';import{useBookingDraft}from'../../state/BookingDraftProvider';import{useRewards}from'../../state/RewardsProvider';import{useCatalogResource}from'../../state/CatalogProvider';import{createPaymentApi}from'../../services/paymentApi';import{confirmationState}from'../../state/bookingDraft';import{useBookingPolling}from'../../state/useBookingPolling';import{QuoteSummary,BookingStatus}from'./TransactionSummary';import type{PaymentMethod}from'../../types/transaction';
import{useUserLocale}from'../../state/useUsdFormatter';
export function PaymentExperience(){
 const locale=useUserLocale();
 const {api,user}=useSession(),{store,state,ready,initialError}=useBookingDraft(),rewards=useRewards();
 const methods=useCatalogResource(signal=>createPaymentApi(api).methods(signal),'payment-methods');const [method,setMethod]=useState<PaymentMethod>('pay_at_property'),[points,setPoints]=useState(''),[localError,setLocalError]=useState('');const now=useBookingPolling();
 useEffect(()=>{if(rewards.ready&&user)void rewards.store.load().catch(()=>{});},[rewards.store,rewards.ready,user?.id]);
 useEffect(()=>{if(ready&&state.intent&&!state.booking)void store.checkout(state.intent.body.paymentMethod).catch(()=>{});},[store,ready]);
 useEffect(()=>{const status=confirmationState(state.booking,state.payment);if(state.booking&&state.payment&&!state.busy&&(status==='paid'||status==='property_unpaid'))router.replace({pathname:'/booking/confirmation',params:{id:state.booking.id}});},[state.booking,state.payment]);
 const attempt=async(job:()=>Promise<unknown>)=>{setLocalError('');try{await job();}catch(e){setLocalError(e instanceof Error?e.message:'Unable to continue.');}};
 const selected=state.intent?.body.paymentMethod??method,q=state.quote,expired=!!q&&now>=Date.parse(q.expiresAt),bank=state.payment?.settlement;
 const hold=state.booking?.holdExpiresAt?Math.max(0,Math.ceil((Date.parse(state.booking.holdExpiresAt)-now)/1000)):0;
 return <CatalogPage title="Checkout" back>
 {!user?<Action title="Sign in" onPress={()=>router.push({pathname:'/auth/demo',params:{returnTo:'/booking/checkout'}})}/>:<>
 <ResourceStatus loading={!ready&&!initialError} error={initialError} retry={()=>void store.changeOwner(user.id).catch(()=>{})}/>
 {!!(state.error||localError)&&<Text accessibilityRole="alert" style={s.error}>{localError||state.error}</Text>}
 {q&&<QuoteSummary quote={q}/>}
 {state.booking?<><BookingStatus booking={state.booking} payment={state.payment}/>
 {bank&&state.booking.status==='pending'&&hold>0&&<View style={[s.card,s.cardBody]}><Text style={s.heading}>SePay Test Mode · demo transfer</Text><Text style={s.price}>{bank.amount.toLocaleString(locale)} VND</Text><Text style={s.text}>Locked demo rate: 1 USD = {bank.usdToVndRate} VND ({bank.rateVersion})</Text><Text selectable style={s.text}>{bank.bankName} · {bank.accountNumber} · {bank.accountHolder}</Text><Text selectable style={s.text}>Transfer reference: {bank.transferReference}</Text>{bank.qrImageUrl&&<Image accessibilityLabel="Test transfer QR code" source={{uri:bank.qrImageUrl}} style={{width:220,height:220,alignSelf:'center'}}/>}<Text style={s.text}>Room hold: {Math.floor(hold/60)}:{String(hold%60).padStart(2,'0')} remaining. Keep the exact reference and VND amount.</Text></View>}
 {state.booking.status==='pending'&&hold===0&&<Text style={s.text}>The room hold has expired. Refresh status before starting a new booking. A later transfer may require a refund.</Text>}
 <Action title="Refresh status" disabled={state.busy} onPress={()=>void attempt(()=>store.refreshStatus())}/>
 {!state.payment&&state.booking.status!=='cancelled'&&<Action title="Retry payment setup" disabled={state.busy} onPress={()=>void attempt(()=>store.checkout(selected))}/>}
 <Action title="View my bookings" secondary onPress={()=>router.replace('/bookings')}/>
 </>:state.intent?<><Text style={s.text}>The previous request has an uncertain result. Retry it using the same payment method.</Text><Action title="Retry booking request" disabled={state.busy} onPress={()=>void attempt(()=>store.checkout(selected))}/></>:q?<>
 <Text style={s.text}>{expired?'Quote expired. Refresh the price before booking.':'Quote valid until '+new Date(q.expiresAt).toLocaleTimeString(locale)}</Text>
 <Action title="Refresh quote" secondary disabled={state.busy} onPress={()=>void attempt(()=>store.refreshQuote())}/>
 <View style={[s.card,s.cardBody]}><Text style={s.heading}>Use rewards</Text><Text style={s.text}>Available: {rewards.state.wallet?.availablePoints.toLocaleString(locale)??'…'} points · 100 points = $1 · maximum 20% of room price</Text><Field label="Points (whole 100-point blocks)" value={points} onChange={setPoints} numeric/><Action title="Apply points" secondary disabled={state.busy} onPress={()=>void attempt(async()=>{if(!/^\d+$/.test(points))throw new Error('Enter whole 100-point blocks.');await store.setBenefits(null,Number(points));await store.refreshQuote();})}/>
 {rewards.state.claims.filter(c=>c.offer.kind==='discount_voucher'&&c.status==='available'&&Date.parse(c.expiresAt)>now).map(c=><Action key={c.id} title={'Use voucher: '+c.offer.title} secondary disabled={state.busy} onPress={()=>void attempt(async()=>{await store.setBenefits(c.id,0);await store.refreshQuote();})}/>)}
 <Action title="Remove discount" secondary disabled={state.busy} onPress={()=>void attempt(async()=>{await store.setBenefits(null,0);await store.refreshQuote();})}/>{!!rewards.state.error&&<Text style={s.error}>{rewards.state.error}</Text>}</View>
 <ResourceStatus {...methods} retry={methods.reload}/>
 {methods.data?.map(option=><View key={option.method} style={{gap:6}}><Action title={(option.method==='bank_transfer'?'Bank transfer · SePay Test Mode':'Pay at property')+(method===option.method?' ✓':'')} secondary disabled={!option.enabled||state.busy} onPress={()=>setMethod(option.method)}/>{!option.enabled&&<Text style={s.text}>{option.disabledReason}</Text>}</View>)}
 <Action title={state.busy?'Please wait…':'Confirm booking · '+(method==='bank_transfer'?'bank transfer':'pay at property')} disabled={state.busy||expired||!methods.data?.find(m=>m.method===method)?.enabled} onPress={()=>void attempt(()=>store.checkout(method))}/>
 </>:<><Text style={s.text}>Select a room and enter guest information to get a server quote.</Text>{state.selection&&state.guest&&<Action title="Retry quote" disabled={state.busy} onPress={()=>void attempt(()=>store.refreshQuote())}/>}<Action title="Find a stay" onPress={()=>router.replace('/search')}/></>}
 </>}
 </CatalogPage>;
}
