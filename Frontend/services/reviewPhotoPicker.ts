import * as ImagePicker from'expo-image-picker';import type{PhotoSource}from'./photoFlow';
export async function pickReviewPhoto():Promise<PhotoSource|null>{
 const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsMultipleSelection:false,quality:1});
 if(result.canceled)return null;const asset=result.assets[0];if(!asset)throw new Error('No image was selected.');
 const ext=(asset.fileName??asset.uri).split(/[?#]/)[0].split('.').pop()?.toLowerCase();
 const guessed=ext==='jpg'||ext==='jpeg'?'image/jpeg':ext==='png'?'image/png':ext==='webp'?'image/webp':'';
 const mimeType=asset.mimeType||guessed;const suffix=mimeType==='image/jpeg'?'jpg':mimeType==='image/png'?'png':'webp';
 return{uri:asset.uri,name:'review.'+suffix,mimeType,sizeBytes:asset.fileSize,file:asset.file};
}
export function photoForm(source:PhotoSource){const form=new FormData();if(source.file)form.append('image',source.file,source.name);else form.append('image',{uri:source.uri,name:source.name,type:source.mimeType} as unknown as Blob);return form;}
