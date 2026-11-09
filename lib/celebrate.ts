import type { Bill } from "./types";

/** Short headline shown on the card right after a luv lands. */
export function celebrationLine(bill: Bill, fullyFunded: boolean): string {
  const n = bill.poster_name;
  if (fullyFunded) {
    switch (bill.category) {
      case "utility": return `${n}'s lights stay on 💡`;
      case "phone":   return `${n} keeps their phone 📱`;
      case "rent":    return `${n} stays home 🏠`;
      case "medical": return `One less bill for ${n} 🩺`;
      case "tuition": return `${n} is one step closer to graduating 🎓`;
      case "car":     return `${n} keeps rolling 🚗`;
      default:        return `${n} can breathe 💗`;
    }
  }
  return `You just got ${n} closer 💗`;
}
