import {createDraftStorage}from'./draftStorage';
const storage=()=>{if(typeof window==='undefined')throw new Error('Booking storage is available in the browser.');return window.sessionStorage;};
import {createClaimStorage}from'./pendingClaimStorage';
const port:import('./draftStorage').PrivateKeyValue={get:async key=>storage().getItem(key),set:async(key,value)=>storage().setItem(key,value),remove:async key=>{if(typeof window!=='undefined')storage().removeItem(key);}};
export const privateDraftStorage=createDraftStorage(port);
export const privateClaimStorage=createClaimStorage(port);
