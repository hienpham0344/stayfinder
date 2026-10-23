export function validateGuest(name:string,email:string,phone:string){
 return{
  name:name.trim().length>=1&&name.trim().length<=100?'':'Vui lòng nhập họ và tên (tối đa 100 ký tự).',
  email:email.trim().length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())?'':'Vui lòng nhập email hợp lệ.',
  phone:!phone.trim()?'Vui lòng nhập số điện thoại.':/^\+?[0-9]{9,15}$/.test(phone.replace(/\s/g,''))?'':'Vui lòng nhập số điện thoại hợp lệ.',
 };
}
