import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { getSessionToken } from "@/lib/auth";

import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Your farm",
};

export default async function Home() {
  const token = await getSessionToken();

  if (!token) {
    redirect("/login");
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.logo} href="/" aria-label="Loom Valley home">
          <span aria-hidden="true">L</span>
          Loom Valley
        </Link>
        <div className={styles.headerActions}>
          <span className={styles.sessionBadge}>
            <i aria-hidden="true" />
            Farm online
          </span>
          <LogoutButton />
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>A fresh day in the valley</p>
          <h1>Your little world is ready to grow.</h1>
          <p>
            Turn focused moments into progress, collect keepsakes, and watch
            your corner of Loom Valley come alive.
          </p>
          <button className={styles.primaryButton} type="button" disabled>
            Start a focus session
            <small>Coming next</small>
          </button>
        </div>

        <div className={styles.farmPreview} aria-hidden="true">
          <div className={styles.previewSun} />
          <div className={styles.previewCloud} />
          <div className={styles.previewHill} />
          <div className={styles.previewHouse}>
            <i />
          </div>
          <div className={styles.previewField} />
        </div>
      </section>

      <section className={styles.featureGrid} aria-label="Farm features">
        <article className={styles.featureCard}>
          <span className={styles.featureIcon} aria-hidden="true">
            <i className={styles.clockIcon} />
          </span>
          <div>
            <p>Build your rhythm</p>
            <h2>Focus sessions</h2>
            <span>Spend intentional time and earn progress for your world.</span>
          </div>
        </article>

        <article className={styles.featureCard}>
          <span className={styles.featureIcon} aria-hidden="true">
            <i className={styles.leafIcon} />
          </span>
          <div>
            <p>Make it your own</p>
            <h2>World collection</h2>
            <span>Discover items and shape a peaceful place that feels yours.</span>
          </div>
        </article>
      </section>

      <footer className={styles.footer}>
        <span>Day 1</span>
        <p>More of the valley is opening soon.</p>
      </footer>
    </main>
  );
}
