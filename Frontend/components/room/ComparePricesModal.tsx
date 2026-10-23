import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { QuoteSelection } from '../../types/catalog';
import { useCatalog, useCatalogResource } from '../../state/CatalogProvider';
import{useUsdFormatter,useUserLocale}from'../../state/useUsdFormatter';
import { Action, ResourceStatus, catalogStyles as s } from '../catalog/CatalogUi';
export function ComparePricesModal({visible,onClose,selection}:{visible:boolean;onClose:()=>void;selection:QuoteSelection}){
 if(!visible)return null;
 return <Modal visible animationType="slide" onRequestClose={onClose}><ComparisonContent selection={selection} onClose={onClose}/></Modal>;
}
function ComparisonContent({selection,onClose}:{selection:QuoteSelection;onClose:()=>void}){
 const formatUsd=useUsdFormatter(),locale=useUserLocale();
 const {catalog}=useCatalog();
 const result=useCatalogResource(signal=>catalog.compare(selection,signal),'comparison:'+JSON.stringify(selection));
 return <SafeAreaView style={s.screen}><View style={s.header}><Text style={s.title}>Compare demo prices</Text><Action title="Close" secondary onPress={onClose}/></View>
 <ScrollView contentContainerStyle={s.body}>
 <Text style={s.text}>Seeded demo data · {selection.checkIn} → {selection.checkOut} · {selection.quantity} rooms · {selection.adults} adults · {selection.children} children</Text>
 <Text style={s.text}>Amounts are for the entire stay. The best price compares offers with fees included and the same cancellation terms.</Text>
 <ResourceStatus {...result} retry={result.reload} empty={result.data?.offers.length===0} emptyText="No comparable demo offers are available."/>
 {result.data?.offers.map((offer,index)=><View key={offer.providerName+index} style={[s.card,s.cardBody]}>
 <Text style={s.heading}>{offer.providerName}{offer.isBestValue?' · Best comparable price':''}</Text>
 <Text style={s.price}>{formatUsd(offer.total)} total</Text><Text style={s.text}>{formatUsd(offer.nightlyPrice)} / room / night</Text>
 <Text style={s.text}>{offer.includesFees?'Includes fees':'Fees excluded · not ranked as best price'}</Text>
 <Text style={s.text}>{offer.cancellationDescription}</Text><Text style={s.text}>Demo · Observed {new Date(offer.observedAt).toLocaleString(locale)}</Text>
 </View>)}
 </ScrollView></SafeAreaView>;
}
