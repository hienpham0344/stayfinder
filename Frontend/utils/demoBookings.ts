export interface DemoBookingState {
  status: 'upcoming' | 'completed' | 'cancelled';
  reviewed?: boolean;
}

export type DemoBookingStates = Record<string, DemoBookingState>;

export function cancelDemoBooking(states: DemoBookingStates, id: string): DemoBookingStates {
  return states[id]?.status === 'upcoming' ? { ...states, [id]: { ...states[id], status: 'cancelled' } } : states;
}

export function reviewDemoBooking(states: DemoBookingStates, id: string): DemoBookingStates {
  return states[id]?.status === 'completed' ? { ...states, [id]: { ...states[id], reviewed: true } } : states;
}
