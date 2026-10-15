import type{MediaUploadDto}from'../types/userFeatures';
export type PhotoSource={uri:string;name:string;mimeType:string;sizeBytes?:number;file?:Blob};
export type PhotoPort={pick():Promise<PhotoSource|null>;upload(source:PhotoSource):Promise<MediaUploadDto>};
export async function pickAndUploadPhoto(port:PhotoPort){
 const source=await port.pick();if(!source)return null;
 if(!['image/jpeg','image/png','image/webp'].includes(source.mimeType))throw new Error('Choose a JPEG, PNG or WebP image.');
 if(source.sizeBytes!==undefined&&(!Number.isSafeInteger(source.sizeBytes)||source.sizeBytes<=0||source.sizeBytes>5*1024*1024))throw new Error('Image must be at most 5 MiB.');
 const result=await port.upload({...source});if(!result?.id||!result.displayUrl)throw new Error('The image upload was not confirmed. Please retry.');return result;
}
