"use client";

import { Clone, Html, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

import styles from "./village.module.css";

export const TREE_MODEL_URL = "/models/tree-beech.gltf";
const TREE_SCALE = 0.08;

export function treeArticle(name: string) {
  return /^[aeiou]/i.test(name.trim()) ? "an" : "a";
}

type VillageTreeProps = {
  tileId: number;
  name: string;
  description: string;
  selected: boolean;
  position: [number, number, number];
};

function TreeModel({
  tileId,
  name,
  description,
  selected,
  position,
}: VillageTreeProps) {
  const { scene } = useGLTF(TREE_MODEL_URL);

  return (
    <group position={position} rotation={[0, (tileId * 0.73) % (Math.PI * 2), 0]}>
      <group scale={TREE_SCALE}>
        <Clone object={scene} castShadow receiveShadow />
      </group>
      {selected ? (
        <Html
          center
          position={[0, 1.45, 0]}
          zIndexRange={[30, 0]}
          occlude={false}
          style={{ pointerEvents: "none" }}
        >
          <div className={styles.treeCaption}>
            <p>
              This is {treeArticle(name)} {name.toLowerCase()}.
            </p>
            <span>{description}</span>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

export function VillageTree(props: VillageTreeProps) {
  return (
    <Suspense fallback={null}>
      <TreeModel {...props} />
    </Suspense>
  );
}

useGLTF.preload(TREE_MODEL_URL);
