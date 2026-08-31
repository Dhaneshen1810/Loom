"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import styles from "./auth.module.css";

type AuthFormProps = {
  mode: "login" | "register";
};

type AuthResponse = {
  status?: string;
  message?: string;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    const form = new FormData(event.currentTarget);
    const credentials = {
      ...(isRegister ? { name: String(form.get("name") ?? "").trim() } : {}),
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const result = (await response.json()) as AuthResponse;

      if (!response.ok || result.status !== "success") {
        setError(result.message ?? "Something went wrong. Please try again.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("The farm is out of reach. Please try again in a moment.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      {isRegister && (
        <label className={styles.field}>
          <span>Farmer name</span>
          <span className={styles.inputWrap}>
            <i className={styles.personIcon} aria-hidden="true" />
            <input
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              minLength={2}
              maxLength={80}
              required
              autoFocus
            />
          </span>
        </label>
      )}

      <label className={styles.field}>
        <span>Email</span>
        <span className={styles.inputWrap}>
          <i className={styles.mailIcon} aria-hidden="true" />
          <input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@email.com"
            required
            autoFocus={!isRegister}
          />
        </span>
      </label>

      <label className={styles.field}>
        <span>Password</span>
        <span className={styles.inputWrap}>
          <i className={styles.keyIcon} aria-hidden="true" />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="Enter your password"
            minLength={isRegister ? 6 : undefined}
            required
            aria-describedby={error ? "auth-error" : undefined}
          />
          <button
            className={styles.revealButton}
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </span>
      </label>

      <div
        id="auth-error"
        className={styles.formError}
        role="alert"
        aria-live="polite"
      >
        {error}
      </div>

      <button className={styles.submitButton} type="submit" disabled={isPending}>
        {isPending
          ? "Planting..."
          : isRegister
            ? "Create Farm"
            : "Log In"}
      </button>

      <p className={styles.switchPrompt}>
        {isRegister ? "Already tending a farm?" : "New to the valley?"}{" "}
        <Link href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Log in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
