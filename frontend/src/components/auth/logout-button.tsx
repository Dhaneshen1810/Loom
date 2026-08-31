"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "@/components/pomodoro/pomodoro.module.css";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function logOut() {
    setIsPending(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      className={styles.logoutButton}
      type="button"
      onClick={logOut}
      disabled={isPending}
    >
      {isPending ? "Leaving..." : "Log out"}
    </button>
  );
}
