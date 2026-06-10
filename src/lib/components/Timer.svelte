<script lang="ts">
  import { formatDuration, phaseLabel } from "$lib/types";
  import { settings } from "$lib/stores/settings";
  import {
    getProgress,
    pause,
    phaseColor,
    resume,
    setEnergyBefore,
    skipCurrentPhase,
    startActivity,
    timer,
  } from "$lib/stores/timer";

  let energyInput = $state(3);

  const timerState = $derived($timer);
  const progress = $derived(getProgress(timerState));
  const circumference = 2 * Math.PI * 88;
  const dashOffset = $derived(circumference * (1 - progress));

  async function handleStart() {
    setEnergyBefore(energyInput);
    await startActivity(energyInput);
  }

  async function handleSkip() {
    await skipCurrentPhase();
  }
</script>

<section class="timer panel">
  <div class="timer-layout">
    <div class="ring-wrap">
      <svg viewBox="0 0 200 200" class="ring" aria-hidden="true">
        <circle cx="100" cy="100" r="88" class="ring-track" />
        <circle
          cx="100"
          cy="100"
          r="88"
          class="ring-progress"
          style={`stroke: ${phaseColor(timerState.phase)}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${dashOffset};`}
        />
      </svg>
      <div class="ring-center">
        <p class="phase-label">{phaseLabel(timerState.phase)}</p>
        <p class="time-display">{formatDuration(timerState.remainingSeconds)}</p>
        <p class="time-sub">
          {#if timerState.phase === "idle"}
            Ready to begin
          {:else if timerState.isRunning}
            Running
          {:else}
            Paused
          {/if}
        </p>
      </div>
    </div>

    <div class="controls">
      {#if timerState.phase === "idle"}
        <div class="field">
          <label for="energy-before">Energy before session (1-5)</label>
          <input
            id="energy-before"
            type="range"
            min="1"
            max="5"
            step="1"
            bind:value={energyInput}
          />
          <span class="muted">{energyInput}</span>
        </div>
        <button class="btn btn-primary" onclick={handleStart}>Start activity</button>
      {:else}
        <div class="button-row">
          {#if timerState.isRunning}
            <button class="btn" onclick={pause}>Pause</button>
          {:else}
            <button class="btn btn-primary" onclick={resume}>Resume</button>
          {/if}
          <button class="btn btn-danger" onclick={handleSkip}>Skip phase</button>
        </div>
      {/if}

      <div class="cycle-info">
        <p>
          <span class="dot activity"></span>
          {$settings.activityMinutes} min activity
          <span class="dot rest"></span>
          {$settings.restMinutes} min rest
        </p>
        <p class="muted">Adjust cycle lengths in Settings.</p>
      </div>
    </div>
  </div>
</section>

<style>
  .timer-layout {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr);
    gap: 1.5rem;
    align-items: center;
  }

  .ring-wrap {
    position: relative;
    width: min(100%, 280px);
    margin: 0 auto;
    aspect-ratio: 1;
  }

  .ring {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .ring-track,
  .ring-progress {
    fill: none;
    stroke-width: 12;
  }

  .ring-track {
    stroke: var(--color-surface-elevated);
  }

  .ring-progress {
    stroke-linecap: round;
    transition: stroke-dashoffset 0.35s ease;
  }

  .ring-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.25rem;
  }

  .phase-label {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .time-display {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .time-sub {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.85rem;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .button-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .cycle-info .dot {
    display: inline-block;
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 50%;
    margin-right: 0.35rem;
  }

  .dot.activity {
    background: var(--color-activity);
  }

  .dot.rest {
    background: var(--color-rest);
    margin-left: 0.75rem;
  }

  @media (max-width: 720px) {
    .timer-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
