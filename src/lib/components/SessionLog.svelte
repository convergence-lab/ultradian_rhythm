<script lang="ts">
  import { onMount } from "svelte";
  import { getRecentSessions, updateSessionMetrics } from "$lib/db";
  import { onSessionsChanged } from "$lib/stores/timer";
  import type { Session } from "$lib/types";
  import { formatDuration } from "$lib/types";

  let sessions = $state<Session[]>([]);
  let selectedId = $state<number | null>(null);
  let focusRating = $state(3);
  let energyAfter = $state(3);
  let note = $state("");

  const selected = $derived(sessions.find((session) => session.id === selectedId) ?? null);

  async function loadSessions() {
    sessions = await getRecentSessions(30);
    if (selectedId && !sessions.some((session) => session.id === selectedId)) {
      selectedId = null;
    }
  }

  onMount(() => {
    void loadSessions();
    return onSessionsChanged(() => {
      void loadSessions();
    });
  });

  function selectSession(session: Session) {
    selectedId = session.id;
    focusRating = session.focus_rating ?? 3;
    energyAfter = session.energy_after ?? 3;
    note = session.note ?? "";
  }

  async function saveMetrics() {
    if (!selected) return;
    await updateSessionMetrics(selected.id, {
      focus_rating: selected.kind === "activity" ? focusRating : null,
      energy_after: energyAfter,
      note: note.trim() || null,
    });
    await loadSessions();
  }

  function sessionDuration(session: Session): string {
    if (!session.ended_at) return "In progress";
    const seconds = Math.max(
      0,
      Math.round(
        (new Date(session.ended_at).getTime() -
          new Date(session.started_at).getTime()) /
          1000,
      ),
    );
    return formatDuration(seconds);
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<section class="panel">
  <h2 class="panel-title">Session log</h2>

  <div class="log-layout">
    <div class="session-list">
      {#if sessions.length === 0}
        <p class="muted">No sessions recorded yet.</p>
      {:else}
        {#each sessions as session (session.id)}
          <button
            class="session-item"
            class:selected={session.id === selectedId}
            onclick={() => selectSession(session)}
          >
            <div class="session-row">
              <span class={`badge ${session.kind}`}>{session.kind}</span>
              <span>{formatTime(session.started_at)}</span>
              <span class="muted">{sessionDuration(session)}</span>
            </div>
            <div class="session-meta muted">
              {session.completed ? "Completed" : "Partial / skipped"}
              {#if session.focus_rating}
                · Focus {session.focus_rating}/5
              {/if}
            </div>
          </button>
        {/each}
      {/if}
    </div>

    <div class="metrics-form">
      {#if selected}
        <h3>Edit metrics</h3>
        <p class="muted">
          {selected.kind} · {new Date(selected.started_at).toLocaleString()}
        </p>

        {#if selected.kind === "activity"}
          <div class="field">
            <label for="focus-rating">Focus rating (1-5)</label>
            <input
              id="focus-rating"
              type="range"
              min="1"
              max="5"
              step="1"
              bind:value={focusRating}
            />
            <span>{focusRating}</span>
          </div>
        {/if}

        <div class="field">
          <label for="energy-after">Energy after (1-5)</label>
          <input
            id="energy-after"
            type="range"
            min="1"
            max="5"
            step="1"
            bind:value={energyAfter}
          />
          <span>{energyAfter}</span>
        </div>

        <div class="field">
          <label for="note">Note</label>
          <textarea id="note" rows="4" bind:value={note} placeholder="Optional reflection"></textarea>
        </div>

        <button class="btn btn-primary" onclick={saveMetrics}>Save metrics</button>
      {:else}
        <p class="muted">Select a session to add or edit focus, energy, and notes.</p>
      {/if}
    </div>
  </div>
</section>

<style>
  .log-layout {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 1rem;
  }

  .session-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 420px;
    overflow: auto;
  }

  .session-item {
    text-align: left;
    border: 1px solid var(--color-border);
    background: var(--color-surface-elevated);
    color: inherit;
    border-radius: 10px;
    padding: 0.75rem;
  }

  .session-item.selected {
    border-color: var(--color-accent);
  }

  .session-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .session-meta {
    margin-top: 0.35rem;
    font-size: 0.85rem;
  }

  .badge {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
  }

  .badge.activity {
    background: rgba(34, 197, 94, 0.15);
    color: #86efac;
  }

  .badge.rest {
    background: rgba(245, 158, 11, 0.15);
    color: #fcd34d;
  }

  .metrics-form h3 {
    margin: 0 0 0.35rem;
    font-size: 1rem;
  }

  .metrics-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  @media (max-width: 720px) {
    .log-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
