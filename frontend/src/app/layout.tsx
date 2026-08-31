import type { Metadata } from "next";
import "@fontsource/vt323";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Loom",
    template: "%s | Loom",
  },
  description: "Grow your world, one focused moment at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
