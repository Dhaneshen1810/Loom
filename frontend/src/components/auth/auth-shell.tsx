import type { ReactNode } from "react";

import styles from "./auth.module.css";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <main className={styles.scene}>
      <div className={styles.sun} aria-hidden="true" />
      <div className={`${styles.cloud} ${styles.cloudOne}`} aria-hidden="true" />
      <div className={`${styles.cloud} ${styles.cloudTwo}`} aria-hidden="true" />
      <div className={styles.mountains} aria-hidden="true" />
      <div className={styles.hills} aria-hidden="true" />
      <div className={styles.treeLeft} aria-hidden="true" />
      <div className={styles.treeRight} aria-hidden="true" />
      <div className={styles.meadow} aria-hidden="true" />
      <div className={styles.path} aria-hidden="true" />
      <div className={styles.fence} aria-hidden="true" />

      <section className={styles.authCard} aria-labelledby="auth-title">
        <i className={`${styles.corner} ${styles.topLeft}`} aria-hidden="true" />
        <i className={`${styles.corner} ${styles.topRight}`} aria-hidden="true" />
        <i
          className={`${styles.corner} ${styles.bottomLeft}`}
          aria-hidden="true"
        />
        <i
          className={`${styles.corner} ${styles.bottomRight}`}
          aria-hidden="true"
        />

        <header className={styles.cardHeader}>
          <span className={styles.sprout} aria-hidden="true">
            <i />
            <i />
          </span>
          <div>
            <h1 id="auth-title">{title}</h1>
            <p>{subtitle}</p>
          </div>
        </header>
        {children}
      </section>

      <p className={styles.brand}>Loom Valley</p>
    </main>
  );
}
