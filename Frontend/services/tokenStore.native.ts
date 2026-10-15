import * as SecureStore from 'expo-secure-store';
import type { TokenStore } from '../types/api';
const KEY = 'stayfinder.refresh.v1';
export const tokenStore: TokenStore = {
  kind: 'native',
  readRefresh: () => SecureStore.getItemAsync(KEY),
  writeRefresh: value => SecureStore.setItemAsync(KEY, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  clearRefresh: () => SecureStore.deleteItemAsync(KEY),
};
