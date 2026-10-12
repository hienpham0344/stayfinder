export function validateGuest(name: string, email: string, phone: string) {
  return {
    name: name.trim() ? '' : 'Vui lòng nhập họ và tên.',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? '' : 'Vui lòng nhập email hợp lệ.',
    phone: !phone.trim() ? 'Vui lòng nhập số điện thoại.' : /^[0-9]{9,11}$/.test(phone.replace(/\s/g, '')) ? '' : 'Vui lòng nhập số điện thoại hợp lệ.',
  };
}
