// Sequences a link's underline motion so every phase runs to completion.
// DESIGN.md: "Adopted link motion".

/**
 * How long each phase of a link's underline motion lasts, in milliseconds.
 * The single source of truth: MenuLink passes these to its CSS animations.
 */
export const DURATIONS = { hover: 240, press: 120, exit: 360, release: 360 };

/** @typedef {'idle' | keyof typeof DURATIONS} Phase */

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * One link's motion, as a state machine:
 *
 *   idle ──enter──▶ hover ──leave──▶ exit ──▶ idle
 *     │               │
 *     └─────press─────┴──▶ press ──release──▶ release ──▶ idle
 *
 * Every phase runs to completion (for its duration, or no time at all under
 * reduced motion). Input meanwhile only updates the intent: whether the link
 * is hovered or held, and whether a press is pending, at most one. When a
 * phase ends, the intent picks the next: a pending press first, from any
 * phase, then hover or exit. `hover` and `press` hold their end state until
 * the intent changes; `exit` and `release` return to idle.
 *
 * @param {(phase: Phase) => void} onPhase Called on every phase change.
 * @param {{ reducedMotion?: () => boolean }} [options]
 */
export function createLinkMotion(onPhase, { reducedMotion = prefersReducedMotion } = {}) {
  /** @type {Phase} */
  let phase = 'idle';
  /** @type {ReturnType<typeof setTimeout> | undefined} Set while a phase runs. */
  let running;
  let hovered = false;
  let held = false;
  let pressPending = false;

  function enterPhase(/** @type {Phase} */ next) {
    phase = next;
    onPhase(phase);
  }

  function run(/** @type {Exclude<Phase, 'idle'>} */ next) {
    enterPhase(next);
    running = setTimeout(
      () => {
        running = undefined;
        if (phase === 'exit' || phase === 'release') enterPhase('idle');
        advance();
      },
      reducedMotion() ? 0 : DURATIONS[next],
    );
  }

  function advance() {
    if (running) return;
    if (phase === 'press') {
      if (!held) run('release');
    } else if (pressPending) {
      pressPending = false;
      run('press');
    } else if (hovered && phase !== 'hover') {
      run('hover');
    } else if (!hovered && phase === 'hover') {
      run('exit');
    }
  }

  return {
    /** The pointer or keyboard focus arrived. */
    enter() {
      hovered = true;
      advance();
    },
    /** The pointer or focus left, which also ends a hold. */
    leave() {
      hovered = false;
      held = false;
      advance();
    },
    /** A press began. A second press waits for the first to collapse. */
    press() {
      held = true;
      hovered = false;
      pressPending = true;
      advance();
    },
    /** The press ended. */
    release() {
      held = false;
      advance();
    },
    /** Cancels a running phase, for when the link is destroyed. */
    stop() {
      clearTimeout(running);
    },
  };
}
