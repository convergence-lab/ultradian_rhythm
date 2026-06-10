<script lang="ts">
  import { onMount } from "svelte";
  import { getDayStats, getTodaySessions } from "$lib/db";
  import { onSessionsChanged } from "$lib/stores/timer";
  import type { DayStats, Session } from "$lib/types";

  let sessions = $state<Session[]>([]);
  let stats = $state<DayStats>({
    completedCycles: 0,
    totalFocusMinutes: 0,
    averageFocus: null,
  });

  const width = 860;
  const height = 120;
  const padding = 24;

  async function loadData() {
    sessions = await getTodaySessions();
    stats = await getDayStats();
  }

  onMount(() => {
    void loadData();
    return onSessionsChanged(() => {
      void loadData();
    });
  });

  function blockPosition(session: Session): { x: number; w: number; y: number; h: number } | null {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);
    const totalMs = dayEnd.getTime() - dayStart.getTime();

    const start = new Date(session.started_at).getTime();
    const end = session.ended_at
      ? new Date(session.ended_at).getTime()
      : Date.now();

    const innerWidth = width - padding * 2;
    const x = padding + ((start - dayStart.getTime()) / totalMs) * innerWidth;
    const w = Math.max(4, ((end - start) / totalMs) * innerWidth);
    const y = session.kind === "activity" ? 28 : 72;
    const h = 32;

    return { x, w, y, h };
  }

  function hourTicks(): number[] {
    return Array.from({ length: 25 }, (_, index) => index);
  }

  function tickX(hour: number): number {
    const innerWidth = width - padding * 2;
    return padding + (hour / 24) * innerWidth;
  }
</script>

<section class="panel">
  <h2 class="panel-title">Today&apos;s rhythm</h2>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-label">Completed cycles</div>
      <div class="stat-value">{stats.completedCycles}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total focus time</div>
      <div class="stat-value">{stats.totalFocusMinutes} min</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Average focus</div>
      <div class="stat-value">
        {stats.averageFocus !== null ? stats.averageFocus.toFixed(1) : "—"}
      </div>
    </div>
  </div>

  <div class="chart-wrap">
    <svg {width} {height} role="img" aria-label="Daily activity timeline">
      <rect x="0" y="0" {width} {height} rx="10" class="chart-bg" />

      {#each hourTicks() as hour}
        <line
          x1={tickX(hour)}
          y1="16"
          x2={tickX(hour)}
          y2={height - 12}
          class="grid-line"
        />
        {#if hour % 3 === 0}
          <text x={tickX(hour)} y="12" class="tick-label">{hour}:00</text>
        {/if}
      {/each}

      <text x={padding} y="24" class="lane-label">Activity</text>
      <text x={padding} y="68" class="lane-label">Rest</text>

      {#each sessions as session (session.id)}
        {@const block = blockPosition(session)}
        {#if block}
          <rect
            x={block.x}
            y={block.y}
            width={block.w}
            height={block.h}
            rx="6"
            class={`block ${session.kind}`}
            opacity={session.completed ? 1 : 0.55}
          />
        {/if}
      {/each}
    </svg>
  </div>

  {#if sessions.length === 0}
    <p class="muted chart-empty">Start a session to populate today&apos;s timeline.</p>
  {/if}
</section>

<style>
  .chart-wrap {
    margin-top: 1rem;
    overflow-x: auto;
  }

  svg {
    display: block;
    min-width: 100%;
  }

  .chart-bg {
    fill: var(--color-surface-elevated);
  }

  .grid-line {
    stroke: rgba(148, 163, 184, 0.15);
    stroke-width: 1;
  }

  .tick-label,
  .lane-label {
    fill: var(--color-text-muted);
    font-size: 10px;
  }

  .block.activity {
    fill: var(--color-activity);
  }

  .block.rest {
    fill: var(--color-rest);
  }

  .chart-empty {
    margin-top: 0.75rem;
  }
</style>
