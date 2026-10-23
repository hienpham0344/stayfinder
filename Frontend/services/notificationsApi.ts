import type{ApiClient}from'./apiClient';import type{NotificationDto,NotificationPage,ReadAllResult}from'../types/userFeatures';
export function createNotificationsApi(api:ApiClient){return{
 list:(page=0,unread=false,signal?:AbortSignal)=>api.request<NotificationPage>('/notifications?page='+page+'&size=20&unread='+unread,{signal}),
 count:(signal?:AbortSignal)=>api.request<{count:number}>('/notifications/unread-count',{signal}),
 read:(id:string,signal?:AbortSignal)=>api.request<NotificationDto>('/notifications/'+encodeURIComponent(id),{method:'PATCH',body:{read:true},signal}),
 readAll:(snapshotTime:string,key:string,signal?:AbortSignal)=>api.request<ReadAllResult>('/notifications/read-all',{method:'POST',body:{snapshotTime},idempotencyKey:key,signal}),
};}export type NotificationsApi=ReturnType<typeof createNotificationsApi>;
