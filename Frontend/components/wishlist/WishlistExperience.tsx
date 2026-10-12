import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '../../state/SessionProvider';
import { useFavorites } from '../../state/FavoritesProvider';
import { Action, CatalogPage, LiveStayCard, ResourceStatus, catalogStyles as s } from '../catalog/CatalogUi';
export function WishlistExperience(){
 const {user,loading}=useSession();const {store,state}=useFavorites();
 return <CatalogPage title="Wishlist" back><Text style={s.heading}>All saves</Text>
 {loading?<ResourceStatus loading error="" retry={()=>{}}/>:!user?<View style={{gap:16}}><Text style={s.text}>Sign in to save places and find them on your other devices.</Text><Action title="Sign in" onPress={()=>router.push({pathname:'/auth/demo',params:{mode:'login',returnTo:'/wishlist'}})}/></View>:<>
 <ResourceStatus loading={state.loading&&state.items.length===0} error={state.error} retry={()=>void store.load()} empty={!state.loading&&!state.error&&state.items.length===0} emptyText="Your wishlist is empty. Save a place for your next trip."/>
 {state.items.map(stay=><LiveStayCard key={stay.id} stay={stay}/>)}
 {state.hasMore&&<Action title={state.loading?'Loading…':'Load more'} disabled={state.loading} onPress={()=>void store.load(true)}/>}
 </>}
 </CatalogPage>;
}
