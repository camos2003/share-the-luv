import SwipeDeck from "@/components/SwipeDeck";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SwipePage() {
  const bills = await getStore().listOpenBills();
  return <SwipeDeck initialBills={bills} />;
}
