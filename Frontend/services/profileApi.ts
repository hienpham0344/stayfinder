import type{ApiClient}from'./apiClient';import type{Preferences,ProfileDto,ProfilePatch,SupportReportRequest,SupportReportResult}from'../types/userFeatures';
export function createProfileApi(api:ApiClient){return{
 get:(signal?:AbortSignal)=>api.request<ProfileDto>('/users/me',{signal}),
 patch:(body:ProfilePatch,signal?:AbortSignal)=>api.request<ProfileDto>('/users/me',{method:'PATCH',body,signal}),
 preferences:(signal?:AbortSignal)=>api.request<Preferences>('/users/me/preferences',{signal}),
 patchPreferences:(body:Partial<Preferences>,signal?:AbortSignal)=>api.request<Preferences>('/users/me/preferences',{method:'PATCH',body,signal}),
 report:(body:SupportReportRequest,key:string,signal?:AbortSignal)=>api.request<SupportReportResult>('/support/reports',{method:'POST',body,idempotencyKey:key,signal}),
};}export type ProfileApi=ReturnType<typeof createProfileApi>;
