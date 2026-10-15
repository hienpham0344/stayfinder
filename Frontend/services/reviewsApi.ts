import type{ApiClient}from'./apiClient';import type{PageResponse}from'../types/api';import type{ReviewDto,ReviewRequest,ReviewPatch,ReviewSummary}from'../types/userFeatures';
export function createReviewsApi(api:ApiClient){return{
 list:(stayId:string,page=0,star?:number,signal?:AbortSignal)=>api.request<PageResponse<ReviewDto>>('/accommodations/'+encodeURIComponent(stayId)+'/reviews?'+new URLSearchParams({page:String(page),size:'20',...(star?{star:String(star)}:{})}),{auth:!!apiHasSession(api),signal}),
 summary:(stayId:string,signal?:AbortSignal)=>api.request<ReviewSummary>('/accommodations/'+encodeURIComponent(stayId)+'/reviews/summary',{auth:false,signal}),
 create:(stayId:string,body:ReviewRequest,signal?:AbortSignal)=>api.request<ReviewDto>('/accommodations/'+encodeURIComponent(stayId)+'/reviews',{method:'POST',body,signal}),
 patch:(id:string,body:ReviewPatch,signal?:AbortSignal)=>api.request<ReviewDto>('/reviews/'+encodeURIComponent(id),{method:'PATCH',body,signal}),
 delete:(id:string,signal?:AbortSignal)=>api.request<null>('/reviews/'+encodeURIComponent(id),{method:'DELETE',signal}),
};}
function apiHasSession(api:ApiClient){return api.isAuthenticated?.()??false;}
export type ReviewsApi=ReturnType<typeof createReviewsApi>;
