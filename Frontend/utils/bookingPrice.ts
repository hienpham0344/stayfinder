export function calculateBookingPrice(pricePerNight: number, nights: number, cleaningFee: number, serviceFee: number) {
  const roomTotal = pricePerNight * nights;
  const fees = cleaningFee + serviceFee;
  return { roomTotal, fees, total: roomTotal + fees };
}
