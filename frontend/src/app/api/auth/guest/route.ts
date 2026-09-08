import { startGuestSession } from "@/lib/backend";

export async function POST() {
  return startGuestSession();
}
