import * as SecureStore from 'expo-secure-store';import {createDraftStorage} from './draftStorage';
import {createClaimStorage}from'./pendingClaimStorage';
const port:import('./draftStorage').PrivateKeyValue={
 get:key=>SecureStore.getItemAsync(key),
 set:(key,value)=>SecureStore.setItemAsync(key,value,{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY}),
 remove:key=>SecureStore.deleteItemAsync(key),
};
export const privateDraftStorage=createDraftStorage(port);
export const privateClaimStorage=createClaimStorage(port);
