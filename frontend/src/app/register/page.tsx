import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Create an account",
};

export default function RegisterPage() {
  return (
    <AuthShell title="New Farmer" subtitle="Plant the first seed of your story">
      <AuthForm mode="register" />
    </AuthShell>
  );
}
