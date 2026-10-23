import type{ApiClient}from'./apiClient';import type{PageResponse}from'../types/api';import type{RewardWallet,RewardOfferDto,RewardClaimDto,RewardHistoryDto}from'../types/transaction';
export function createRewardsApi(api:ApiClient){return{
 wallet:(signal?:AbortSignal)=>api.request<RewardWallet>('/rewards/wallet',{signal}),
 catalog:(signal?:AbortSignal)=>api.request<RewardOfferDto[]>('/rewards/catalog',{signal}),
 history:(page=0,signal?:AbortSignal)=>api.request<PageResponse<RewardHistoryDto>>('/rewards/history?page='+page+'&size=20',{signal}),
 claims:(page=0,signal?:AbortSignal)=>api.request<PageResponse<RewardClaimDto>>('/rewards/claims?page='+page+'&size=20',{signal}),
 claim:(offerId:string,key:string,signal?:AbortSignal)=>api.request<RewardClaimDto>('/rewards/claims',{method:'POST',body:{offerId},idempotencyKey:key,signal}),
};}export type RewardsApi=ReturnType<typeof createRewardsApi>;
