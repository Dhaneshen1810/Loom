import styles from "./village.module.css";

type TreeKind = "oak" | "cherry" | "spruce";

function treeKind(name: string): TreeKind {
  const label = name.toLowerCase();

  if (label.includes("cherry") || label.includes("blossom")) {
    return "cherry";
  }

  if (label.includes("spruce") || label.includes("pine")) {
    return "spruce";
  }

  return "oak";
}

function OakSprite() {
  return (
    <svg className={styles.sprite} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="14" y="21" width="4" height="8" fill="#7a4624" />
      <rect x="13" y="24" width="2" height="3" fill="#5c3418" />
      <circle cx="16" cy="14" r="7.5" fill="#3f8f2f" />
      <circle cx="11" cy="17" r="5" fill="#4eaa3a" />
      <circle cx="21" cy="17" r="5" fill="#2f7a24" />
      <circle cx="16" cy="10" r="4" fill="#5fbf45" />
    </svg>
  );
}

function CherrySprite() {
  return (
    <svg className={styles.sprite} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="14" y="20" width="4" height="9" fill="#6b3a22" />
      <rect x="15" y="16" width="2" height="5" fill="#6b3a22" />
      <circle cx="16" cy="13" r="8" fill="#f4a7c1" />
      <circle cx="10" cy="15" r="5" fill="#ef7eaa" />
      <circle cx="22" cy="15" r="5" fill="#ffc1d6" />
      <circle cx="16" cy="8" r="4.2" fill="#ffe0ea" />
      <circle cx="12" cy="12" r="1.2" fill="#fff7fb" />
      <circle cx="19" cy="11" r="1.1" fill="#fff7fb" />
      <circle cx="15" cy="16" r="1" fill="#fff7fb" />
      <circle cx="21" cy="17" r="1.1" fill="#fff7fb" />
    </svg>
  );
}

function SpruceSprite() {
  return (
    <svg className={styles.sprite} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="14.5" y="23" width="3" height="6" fill="#6b3a22" />
      <polygon points="16,4 25,13 7,13" fill="#2f7a3a" />
      <polygon points="16,8 26,18 6,18" fill="#246b32" />
      <polygon points="16,13 27,24 5,24" fill="#1e5c2c" />
      <polygon points="16,6 22,13 10,13" fill="#4eaa4a" />
    </svg>
  );
}

export function treeArticle(name: string) {
  return /^[aeiou]/i.test(name.trim()) ? "an" : "a";
}

export function TileSprite({ name }: { name: string }) {
  switch (treeKind(name)) {
    case "cherry":
      return <CherrySprite />;
    case "spruce":
      return <SpruceSprite />;
    case "oak":
    default:
      return <OakSprite />;
  }
}
