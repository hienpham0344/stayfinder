import type{ApiClient}from'./apiClient';import type{MediaUploadDto}from'../types/userFeatures';
export function createMediaApi(api:ApiClient){return{
 upload:(form:FormData,signal?:AbortSignal)=>api.request<MediaUploadDto>('/media',{method:'POST',body:form,signal}),
 delete:(id:string,signal?:AbortSignal)=>api.request<null>('/media/'+encodeURIComponent(id),{method:'DELETE',signal}),
};}
