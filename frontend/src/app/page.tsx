import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";
import { getSessionToken } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Pomodoro",
};

export default async function Home() {
  const token = await getSessionToken();

  if (!token) {
    redirect("/login");
  }

  return <PomodoroTimer />;
}
