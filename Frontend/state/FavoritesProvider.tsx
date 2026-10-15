import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from './SessionProvider';
import { createFavoritesApi } from '../services/favoritesApi';
import { FavoritesStore } from './favoritesStore';
const Context=createContext<{store:FavoritesStore;state:ReturnType<FavoritesStore['snapshot']>}|null>(null);
export function FavoritesProvider({children}:{children:React.ReactNode}){
 const {api,user}=useSession();
 // New owner receives a fresh store immediately, before effects or old requests can publish.
 const store=useMemo(()=>{const s=new FavoritesStore(createFavoritesApi(api));s.changeOwner(user?.id??null);return s;},[api,user?.id]);
 const [,render]=useState(0);
 useEffect(()=>{
  const unsubscribe=store.subscribe(()=>render(n=>n+1));void store.load();
  return()=>{unsubscribe();store.changeOwner(null);};
 },[store]);
 return <Context.Provider value={{store,state:store.snapshot()}}>{children}</Context.Provider>;
}
export function useFavorites(){const value=useContext(Context);if(!value)throw new Error('FavoritesProvider is required');return value;}
