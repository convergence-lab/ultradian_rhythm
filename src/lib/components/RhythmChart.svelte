<script lang="ts">
  import { onMount } from "svelte";
  import {
    getEarliestSessionDate,
    getSessionsForDateRange,
  } from "$lib/db";
  import { onSessionsChanged, timer } from "$lib/stores/timer";
  import type { ActiveSessionTiming, DayStats, Session } from "$lib/types";
  import {
    addDays,
    computeDayStats,
    isSameDay,
    sessionChartEndMs,
    startOfDay,
    toDateInputValue,
  } from "$lib/types";

  const WEEK_DAYS = 7;
  const chartWidth = 720;
  const chartHeight = 44;
  const padding = 4;

  interface DayRow {
    date: Date;
    sessions: Session[];
    stats: DayStats;
  }

  let weekEnd = $state(startOfDay(new Date()));
  let dayRows = $state<DayRow[]>([]);
  let weekStats = $state<DayStats>({
    completedCycles: 0,
    totalFocusMinutes: 0,
    averageFocus: null,
  });
  let earliestDate = $state<Date | null>(null);
  let loadSeq = 0;

  const today = $derived(startOfDay(new Date()));
  const weekStart = $derived(addDays(weekEnd, -(WEEK_DAYS - 1)));
  const isCurrentWeek = $derived(isSameDay(weekEnd, today));
  const canGoNext = $derived(!isCurrentWeek);
  const canGoPrev = $derived(
    earliestDate === null || weekStart > startOfDay(earliestDate),
  );

  const weekRangeLabel = $derived(
    `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`,
  );

  const timerState = $derived($timer);

  const activeTiming = $derived<ActiveSessionTiming>({
    activeSessionId: timerState.currentSessionId,
    pausedAt: timerState.pausedAt,
    totalPausedMs: timerState.totalPausedMs,
  });

  async function loadData() {
    const seq = ++loadSeq;
    const rangeStart = addDays(weekEnd, -(WEEK_DAYS - 1));
    const sessions = await getSessionsForDateRange(rangeStart, weekEnd);
    if (seq !== loadSeq) return;

    earliestDate = await getEarliestSessionDate();
    if (seq !== loadSeq) return;

    const grouped = new Map<string, Session[]>();
    for (let i = 0; i < WEEK_DAYS; i++) {
      const date = addDays(weekStart, i);
      grouped.set(toDateInputValue(date), []);
    }
    for (const session of sessions) {
      const key = toDateInputValue(startOfDay(new Date(session.started_at)));
      grouped.get(key)?.push(session);
    }

    dayRows = Array.from({ length: WEEK_DAYS }, (_, index) => {
      const date = addDays(weekStart, index);
      const daySessions = grouped.get(toDateInputValue(date)) ?? [];
      const timing = isSameDay(date, today) ? activeTiming : undefined;
      return {
        date,
        sessions: daySessions,
        stats: computeDayStats(daySessions, timing),
      };
    });

    weekStats = computeDayStats(sessions, activeTiming);
  }

  onMount(() => {
    void loadData();
    return onSessionsChanged(() => {
      void loadData();
    });
  });

  async function shiftWeek(offset: number) {
    const nextEnd = addDays(weekEnd, offset * WEEK_DAYS);
    if (nextEnd > today) {
      weekEnd = today;
    } else if (
      earliestDate &&
      addDays(nextEnd, -(WEEK_DAYS - 1)) < startOfDay(earliestDate)
    ) {
      weekEnd = addDays(startOfDay(earliestDate), WEEK_DAYS - 1);
      if (weekEnd > today) weekEnd = today;
    } else {
      weekEnd = nextEnd;
    }
    await loadData();
  }

  async function goPrevWeek() {
    if (!canGoPrev) return;
    await shiftWeek(-1);
  }

  async function goNextWeek() {
    if (!canGoNext) return;
    await shiftWeek(1);
  }

  async function goThisWeek() {
    weekEnd = today;
    await loadData();
  }

  function formatDayLabel(date: Date): string {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "numeric",
      day: "numeric",
    });
  }

  function sessionEndMs(session: Session, dayDate: Date): number {
    const timing = isSameDay(dayDate, today) ? activeTiming : undefined;
    return sessionChartEndMs(session, timing);
  }

  function blockPosition(
    session: Session,
    dayDate: Date,
  ): { x: number; w: number; y: number; h: number } | null {
    const dayStart = startOfDay(dayDate);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const totalMs = dayEnd.getTime() - dayStart.getTime();

    const start = new Date(session.started_at).getTime();
    const end = sessionEndMs(session, dayDate);

    const innerWidth = chartWidth - padding * 2;
    const x = padding + ((start - dayStart.getTime()) / totalMs) * innerWidth;
    const durationMs = Math.max(0, end - start);
    const w = Math.max(3, (durationMs / totalMs) * innerWidth);
    const y = session.kind === "activity" ? 6 : 26;
    const h = 14;

    return { x, w, y, h };
  }

  function tickX(hour: number): number {
    const innerWidth = chartWidth - padding * 2;
    return padding + (hour / 24) * innerWidth;
  }

  function hourTicks(): number[] {
    return Array.from({ length: 25 }, (_, index) => index);
  }
</script>

<section class="panel">
  <div class="chart-header">
    <h2 class="panel-title">Weekly rhythm</h2>

    <div class="week-nav">
      <button class="btn nav-btn" onclick={goPrevWeek} disabled={!canGoPrev} aria-label="Previous week">
        ←
      </button>
      <span class="week-range">{weekRangeLabel}</span>
      <button class="btn nav-btn" onclick={goNextWeek} disabled={!canGoNext} aria-label="Next week">
        →
      </button>
      {#if !isCurrentWeek}
        <button class="btn" onclick={goThisWeek}>This week</button>
      {/if}
    </div>
  </div>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-label">Week cycles</div>
      <div class="stat-value">{weekStats.completedCycles}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Week focus time</div>
      <div class="stat-value">{weekStats.totalFocusMinutes} min</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Week avg focus</div>
      <div class="stat-value">
        {weekStats.averageFocus !== null ? weekStats.averageFocus.toFixed(1) : "—"}
      </div>
    </div>
  </div>

  <div class="week-chart">
    {#each dayRows as row (toDateInputValue(row.date))}
      <div class="day-row" class:today={isSameDay(row.date, today)}>
        <div class="day-label">
          <span class="day-name">{formatDayLabel(row.date)}</span>
          {#if isSameDay(row.date, today)}
            <span class="today-badge">Today</span>
          {/if}
        </div>

        <div class="day-chart-wrap">
          <svg
            viewBox="0 0 {chartWidth} {chartHeight}"
            class="day-chart"
            role="img"
            aria-label="Activity timeline for {formatDayLabel(row.date)}"
          >
            <rect x="0" y="0" width={chartWidth} height={chartHeight} rx="6" class="chart-bg" />

            {#each hourTicks() as hour}
              <line
                x1={tickX(hour)}
                y1="2"
                x2={tickX(hour)}
                y2={chartHeight - 2}
                class="grid-line"
              />
            {/each}

            {#each row.sessions as session (session.id)}
              {@const block = blockPosition(session, row.date)}
              {#if block}
                <rect
                  x={block.x}
                  y={block.y}
                  width={block.w}
                  height={block.h}
                  rx="3"
                  class={`block ${session.kind}`}
                  opacity={session.completed ? 1 : 0.55}
                />
              {/if}
            {/each}
          </svg>
        </div>

        <div class="day-stats">
          {#if row.stats.completedCycles > 0 || row.stats.totalFocusMinutes > 0}
            <span>{row.stats.completedCycles} cycles</span>
            <span>{row.stats.totalFocusMinutes} min</span>
          {:else}
            <span class="muted">—</span>
          {/if}
        </div>
      </div>
    {/each}

    <div class="hour-axis" aria-hidden="true">
      <span class="axis-spacer"></span>
      <div class="axis-labels">
        {#each [0, 6, 12, 18, 24] as hour}
          <span style={`left: ${(hour / 24) * 100}%`}>{hour === 24 ? "24:00" : `${hour}:00`}</span>
        {/each}
      </div>
      <span class="stats-spacer"></span>
    </div>
  </div>

  {#if dayRows.every((row) => row.sessions.length === 0)}
    <p class="muted chart-empty">Start a session to populate your weekly timeline.</p>
  {/if}
</section>

<style>
  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .chart-header .panel-title {
    margin: 0;
  }

  .week-nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .week-range {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    min-width: 10rem;
    text-align: center;
  }

  .nav-btn {
    min-width: 2.25rem;
    padding: 0.45rem 0.65rem;
  }

  .nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .week-chart {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .day-row {
    display: grid;
    grid-template-columns: 7.5rem 1fr 5.5rem;
    gap: 0.75rem;
    align-items: center;
    padding: 0.35rem 0;
    border-bottom: 1px solid var(--color-border);
  }

  .day-row.today {
    background: rgba(56, 189, 248, 0.06);
    border-radius: 8px;
    padding: 0.35rem 0.5rem;
    border-bottom-color: transparent;
  }

  .day-label {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .day-name {
    font-size: 0.85rem;
    font-weight: 500;
  }

  .today-badge {
    font-size: 0.7rem;
    color: var(--color-accent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .day-chart-wrap {
    overflow: hidden;
  }

  .day-chart {
    display: block;
    width: 100%;
    height: auto;
  }

  .chart-bg {
    fill: var(--color-surface-elevated);
  }

  .grid-line {
    stroke: rgba(148, 163, 184, 0.12);
    stroke-width: 1;
  }

  .block.activity {
    fill: var(--color-activity);
  }

  .block.rest {
    fill: var(--color-rest);
  }

  .day-stats {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-align: right;
  }

  .hour-axis {
    display: grid;
    grid-template-columns: 7.5rem 1fr 5.5rem;
    gap: 0.75rem;
    margin-top: 0.25rem;
  }

  .axis-labels {
    position: relative;
    height: 1rem;
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }

  .axis-labels span {
    position: absolute;
    transform: translateX(-50%);
  }

  .axis-labels span:first-child {
    transform: none;
  }

  .axis-labels span:last-child {
    transform: translateX(-100%);
  }

  .chart-empty {
    margin-top: 0.75rem;
  }

  @media (max-width: 720px) {
    .day-row,
    .hour-axis {
      grid-template-columns: 5rem 1fr;
    }

    .day-stats,
    .stats-spacer {
      display: none;
    }
  }
</style>
