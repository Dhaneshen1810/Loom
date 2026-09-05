"use client";

import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import {
  MAX_GOAL_DESCRIPTION_LENGTH,
  normalizeGoalDescription,
} from "@/lib/focus-session";

import styles from "./pomodoro.module.css";

const DEFAULT_DURATION_SECONDS = 25 * 60;
const DURATION_OPTIONS_SECONDS = [
  0,
  5,
  ...Array.from({ length: 12 }, (_, index) => (index + 1) * 5 * 60),
];
const ACTIVE_SESSION_KEY = "loom-active-focus-session";

type ActiveSession = {
  sessionId: string;
  endsAt: number;
  durationSeconds: number;
  goalDescription?: string | null;
};

type ApiResponse = {
  status?: string;
  message?: string;
  sessionId?: string;
  coins?: number;
  coinsAwarded?: number;
};

type Phase =
  | "idle"
  | "starting"
  | "running"
  | "finishing"
  | "resetting"
  | "complete"
  | "error";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder
    .toString()
    .padStart(2, "0")}`;
}

function formatDuration(seconds: number) {
  return seconds < 60 ? `${seconds} sec` : `${seconds / 60} min`;
}

function expectedCoinReward(seconds: number) {
  return Math.min(60, Math.max(5, Math.ceil(seconds / 300) * 5));
}

function durationOptionIndex(seconds: number) {
  const index = DURATION_OPTIONS_SECONDS.indexOf(seconds);
  return index === -1
    ? DURATION_OPTIONS_SECONDS.indexOf(DEFAULT_DURATION_SECONDS)
    : index;
}

export function PomodoroTimer() {
  const [selectedDuration, setSelectedDuration] = useState(
    DEFAULT_DURATION_SECONDS,
  );
  const [remaining, setRemaining] = useState(DEFAULT_DURATION_SECONDS);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [coins, setCoins] = useState<number | null>(null);
  const [coinsAwarded, setCoinsAwarded] = useState<number | null>(null);
  const [goalDescription, setGoalDescription] = useState("");
  const finishingRef = useRef(false);
  const coinsRef = useRef<number | null>(null);

  const closeSession = useCallback(
    async (session: ActiveSession, completed: boolean) => {
      if (finishingRef.current) {
        return;
      }

      finishingRef.current = true;
      setPhase(completed ? "finishing" : "resetting");
      setMessage("");

      try {
        const response = await fetch(
          `/api/focus-session/${session.sessionId}/end`,
          { method: "POST" },
        );
        const result = (await response.json()) as ApiResponse;

        if (!response.ok || result.status !== "success") {
          throw new Error(result.message ?? "Your progress could not be saved.");
        }

        localStorage.removeItem(ACTIVE_SESSION_KEY);
        setActiveSession(null);

        const previousCoins = coinsRef.current;

        if (typeof result.coins === "number") {
          coinsRef.current = result.coins;
          setCoins(result.coins);
        }

        if (completed) {
          setRemaining(0);
          setCoinsAwarded(
            typeof result.coinsAwarded === "number"
              ? result.coinsAwarded
              : typeof result.coins === "number" && previousCoins !== null
                ? Math.max(0, result.coins - previousCoins)
                : expectedCoinReward(session.durationSeconds),
          );
          setMessage("Pomodoro complete. Your focus has been harvested!");
          setPhase("complete");
        } else {
          setRemaining(session.durationSeconds);
          setCoinsAwarded(null);
          setMessage("Timer reset. Start again when you are ready.");
          setPhase("idle");
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Your progress could not be saved.",
        );
        setPhase("error");
      } finally {
        finishingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    let storedSession: ActiveSession | null = null;

    void fetch("/api/users/me", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as ApiResponse;

        if (response.ok && typeof result.coins === "number") {
          coinsRef.current = result.coins;
          setCoins(result.coins);
        }
      })
      .catch(() => {
        // The timer remains usable if the balance is temporarily unavailable.
      });

    try {
      const stored = JSON.parse(
        localStorage.getItem(ACTIVE_SESSION_KEY) ?? "null",
      ) as ActiveSession | null;

      if (
        stored &&
        typeof stored.sessionId === "string" &&
        Number.isFinite(stored.endsAt) &&
        Number.isFinite(stored.durationSeconds)
      ) {
        storedSession = {
          ...stored,
          goalDescription:
            typeof stored.goalDescription === "string"
              ? stored.goalDescription
              : null,
        };
      }
    } catch {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }

    const frame = window.requestAnimationFrame(() => {
      if (storedSession) {
        setActiveSession(storedSession);
        setGoalDescription(storedSession.goalDescription ?? "");
        setSelectedDuration(storedSession.durationSeconds);
        setRemaining(
          Math.max(0, Math.ceil((storedSession.endsAt - Date.now()) / 1000)),
        );
        setPhase("running");
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (phase !== "running" && phase !== "finishing") {
      return;
    }

    if (!("wakeLock" in navigator)) {
      return;
    }

    let cancelled = false;
    let sentinel: WakeLockSentinel | null = null;

    async function keepDisplayOn() {
      if (cancelled || document.visibilityState !== "visible") {
        return;
      }

      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        // Power settings or an inactive tab can deny the lock.
      }
    }

    void keepDisplayOn();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void keepDisplayOn();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void sentinel?.release();
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "running" || !activeSession) {
      return;
    }

    const session = activeSession;

    function updateTimer() {
      const secondsLeft = Math.max(
        0,
        Math.ceil((session.endsAt - Date.now()) / 1000),
      );
      setRemaining(secondsLeft);

      if (secondsLeft === 0) {
        void closeSession(session, true);
      }
    }

    updateTimer();
    const timer = window.setInterval(updateTimer, 250);
    return () => window.clearInterval(timer);
  }, [activeSession, closeSession, phase]);

  useEffect(() => {
    document.title =
      phase === "running"
        ? `${formatTime(remaining)} | Loom`
        : "Pomodoro | Loom";
  }, [phase, remaining]);

  useEffect(() => {
    if (coinsAwarded === null) {
      return;
    }

    const timeout = window.setTimeout(() => setCoinsAwarded(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [coinsAwarded]);

  async function startTimer() {
    const durationSeconds = selectedDuration;

    if (durationSeconds === 0) {
      return;
    }

    const description = normalizeGoalDescription(goalDescription);

    if (!description.ok) {
      setMessage(description.message);
      setPhase("error");
      return;
    }

    setPhase("starting");
    setMessage("");
    setCoinsAwarded(null);

    try {
      const response = await fetch("/api/focus-session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_seconds: durationSeconds,
          goal_description: description.value,
        }),
      });
      const result = (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        result.status !== "success" ||
        typeof result.sessionId !== "string"
      ) {
        throw new Error(result.message ?? "The timer could not be started.");
      }

      const session = {
        sessionId: result.sessionId,
        endsAt: Date.now() + durationSeconds * 1000,
        durationSeconds,
        goalDescription: description.value,
      };
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
      setActiveSession(session);
      setRemaining(durationSeconds);
      setPhase("running");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "The timer could not be started.",
      );
      setPhase("error");
    }
  }

  function setDurationByIndex(index: number) {
    const nextIndex = Math.min(
      DURATION_OPTIONS_SECONDS.length - 1,
      Math.max(0, Math.round(index)),
    );
    const nextDuration = DURATION_OPTIONS_SECONDS[nextIndex];
    setSelectedDuration(nextDuration);
    setRemaining(nextDuration);
    setMessage("");
    setPhase("idle");
  }

  const duration = activeSession?.durationSeconds ?? selectedDuration;
  const progress =
    duration === 0
      ? 0
      : phase === "complete"
        ? 100
        : Math.min(100, Math.max(0, ((duration - remaining) / duration) * 100));
  const isBusy = phase === "starting" || phase === "finishing" || phase === "resetting";
  const isRunning = phase === "running" || phase === "finishing";
  const canAdjust = !activeSession && !isBusy;
  const selectedDurationIndex = durationOptionIndex(selectedDuration);

  return (
    <main className={styles.scene}>
      <div className={styles.clouds} aria-hidden="true" />
      <div className={styles.mountains} aria-hidden="true" />
      <div className={styles.farmhouse} aria-hidden="true" />
      <div className={styles.fence} aria-hidden="true" />
      <div className={styles.meadow} aria-hidden="true" />

      <header className={styles.titleSign}>
        <i aria-hidden="true" />
        <h1>Pomodoro</h1>
        <i aria-hidden="true" />
      </header>

      <div
        className={styles.coinCounter}
        aria-label={coins === null ? "Coin balance loading" : `${coins} coins`}
      >
        <i aria-hidden="true" />
        <span>{coins === null ? "..." : coins}</span>
      </div>

      {phase === "complete" && coinsAwarded !== null && (
        <div className={styles.rewardBanner} role="status" aria-live="assertive">
          <div className={styles.coinBurst} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <button
            type="button"
            onClick={() => setCoinsAwarded(null)}
            aria-label="Dismiss reward banner"
          >
            ×
          </button>
          <p>Harvest complete!</p>
          <strong>+{coinsAwarded} coins</strong>
        </div>
      )}

      <aside className={styles.sidebar} aria-label="Pomodoro navigation">
        <button className={styles.activeNav} type="button">
          <span className={styles.timerIcon} aria-hidden="true" />
          Timer
        </button>
        <Link href="/village">
          <span className={styles.villageIcon} aria-hidden="true" />
          Village
        </Link>
        <div className={styles.logoutWrap}>
          <LogoutButton />
        </div>
      </aside>

      <section className={styles.timerCard} aria-labelledby="focus-title">
        <p id="focus-title" className={styles.focusLabel}>
          {phase === "complete" ? "Harvest Complete" : "Focus Time"}
        </p>
        <label className={styles.goalField} htmlFor="focus-goal">
          <span className={styles.goalLabel}>Goal</span>
          <input
            id="focus-goal"
            type="text"
            value={goalDescription}
            maxLength={MAX_GOAL_DESCRIPTION_LENGTH}
            disabled={!canAdjust}
            autoComplete="off"
            placeholder="What are you focusing on?"
            onChange={(event) => setGoalDescription(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                canAdjust &&
                selectedDuration > 0
              ) {
                event.preventDefault();
                void startTimer();
              }
            }}
          />
        </label>
        <div className={styles.durationPicker}>
          <output htmlFor="focus-duration" aria-live="polite">
            {formatDuration(selectedDuration)}
          </output>
          <input
            id="focus-duration"
            className={styles.durationSlider}
            type="range"
            min={0}
            max={DURATION_OPTIONS_SECONDS.length - 1}
            step={1}
            value={selectedDurationIndex}
            disabled={!canAdjust}
            aria-label="Focus duration"
            aria-valuetext={formatDuration(selectedDuration)}
            style={
              {
                "--duration-progress": `${
                  (selectedDurationIndex / (DURATION_OPTIONS_SECONDS.length - 1)) *
                  100
                }%`,
              } as CSSProperties
            }
            onChange={(event) => setDurationByIndex(Number(event.target.value))}
          />
        </div>
        <time className={styles.time} dateTime={`PT${remaining}S`}>
          {formatTime(remaining)}
        </time>

        <div
          className={`${styles.tomato} ${isRunning ? styles.tomatoRunning : ""}`}
          aria-hidden="true"
        >
          <i />
        </div>

        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label="Pomodoro progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          style={{ "--progress": `${progress}%` } as CSSProperties}
        >
          <span />
        </div>

        <div className={styles.controls}>
          {isRunning ? (
            <>
              <button className={styles.focusButton} type="button" disabled>
                {phase === "finishing" ? "Saving..." : "Focusing"}
              </button>
              <button
                className={styles.resetButton}
                type="button"
                onClick={() =>
                  activeSession && void closeSession(activeSession, false)
                }
                disabled={isBusy}
              >
                Reset session
              </button>
            </>
          ) : phase === "error" && activeSession ? (
            <>
              <button
                className={styles.focusButton}
                type="button"
                onClick={() => void closeSession(activeSession, remaining === 0)}
              >
                Retry Save
              </button>
              <button
                className={styles.resetButton}
                type="button"
                onClick={() => void closeSession(activeSession, false)}
              >
                Reset session
              </button>
            </>
          ) : (
            <button
              className={styles.focusButton}
              type="button"
              onClick={() => void startTimer()}
              disabled={isBusy || selectedDuration === 0}
            >
              {phase === "starting"
                ? "Planting..."
                : phase === "complete"
                  ? "Start Another"
                  : "Start"}
            </button>
          )}
        </div>

        <p className={styles.status} role="status" aria-live="polite">
          {message}
        </p>
      </section>
    </main>
  );
}
