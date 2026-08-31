"use client";

import dynamic from "next/dynamic";

import styles from "./village.module.css";

const VillageScene = dynamic(
  () => import("./village-scene").then((module) => module.VillageScene),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loading}>
        <span />
        Shaping the land...
      </div>
    ),
  },
);

export function VillageCanvas({ coins }: { coins: number | null }) {
  return <VillageScene coins={coins} />;
}
