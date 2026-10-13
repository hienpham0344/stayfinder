import{useCallback}from'react';import{useProfile}from'./ProfileProvider';import{formatUsd}from'../services/dtoAdapters';import type{MoneyUsd}from'../types/api';
export function useUsdFormatter(){const{state}=useProfile();const locale=state.preferences?.language??'en-US';return useCallback((money:MoneyUsd)=>formatUsd(money,locale),[locale]);}
