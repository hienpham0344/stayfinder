import{useCallback}from'react';import{useProfile}from'./ProfileProvider';import{formatUsd}from'../services/dtoAdapters';import type{MoneyUsd}from'../types/api';
export function useUserLocale(){return useProfile().state.preferences?.language??'en-US';}
export function useUsdFormatter(){const locale=useUserLocale();return useCallback((money:MoneyUsd)=>formatUsd(money,locale),[locale]);}
