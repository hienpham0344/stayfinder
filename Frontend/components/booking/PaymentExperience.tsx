import React from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Action, CatalogPage, catalogStyles as s } from '../catalog/CatalogUi';
// Replaced by the quote/booking integration in the next approved milestone.
// Never infer a charge or booking success from a timer or local fixture.
export function PaymentExperience(){
 return <CatalogPage title="Checkout" back><Text style={s.text}>Unable to continue booking right now. Please try again later.</Text><Action title="Back to room selection" secondary onPress={()=>router.back()}/></CatalogPage>;
}
