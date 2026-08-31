import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { VillageCanvas } from "@/components/village/village-canvas";
import { getSessionToken } from "@/lib/auth";
import { getCoinBalance } from "@/lib/user";

import styles from "./village.module.css";

export const metadata: Metadata = {
  title: "Your village",
};

export default async function VillagePage() {
  const token = await getSessionToken();

  if (!token) {
    redirect("/login");
  }

  const coins = await getCoinBalance();

  return (
    <main className={styles.scene}>
      <header className={styles.titleSign}>
        <i aria-hidden="true" />
        <div>
          <p>Loom Valley</p>
          <h1>Your Village</h1>
        </div>
        <i aria-hidden="true" />
      </header>

      <nav className={styles.navigation} aria-label="Main navigation">
        <Link href="/">
          <span className={styles.timerIcon} aria-hidden="true" />
          Timer
        </Link>
        <Link className={styles.activeNav} href="/village" aria-current="page">
          <span className={styles.villageIcon} aria-hidden="true" />
          Village
        </Link>
        <div className={styles.logoutWrap}>
          <LogoutButton />
        </div>
      </nav>

      <section className={styles.villageStage} aria-labelledby="village-heading">
        <h2 id="village-heading" className={styles.visuallyHidden}>
          Village grounds, 7 by 7 empty plots
        </h2>
        <VillageCanvas coins={coins} />
      </section>
    </main>
  );
}
