import React from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Action, CatalogPage, catalogStyles as s } from '../catalog/CatalogUi';
export function BookingConfirmationExperience(){
 return <CatalogPage title="Booking status" back><Text style={s.text}>No confirmed booking is available here.</Text><Action title="View my bookings" onPress={()=>router.replace('/bookings')}/></CatalogPage>;
}
