<script lang="ts">
  import { onMount } from "svelte";
  import "../app.css";
  import RhythmChart from "$lib/components/RhythmChart.svelte";
  import SessionLog from "$lib/components/SessionLog.svelte";
  import SettingsPanel from "$lib/components/Settings.svelte";
  import Timer from "$lib/components/Timer.svelte";
  import { initNotifications } from "$lib/notify";
  import { initSettings } from "$lib/stores/settings";

  type Tab = "timer" | "log" | "chart" | "settings";
  let activeTab = $state<Tab>("timer");

  onMount(async () => {
    await initSettings();
    await initNotifications();
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "timer", label: "Timer" },
    { id: "log", label: "Log" },
    { id: "chart", label: "Chart" },
    { id: "settings", label: "Settings" },
  ];
</script>

<div class="app-shell">
  <header class="app-header">
    <h1>Ultradian Rhythm</h1>
    <nav class="app-nav" aria-label="Main navigation">
      {#each tabs as tab}
        <button
          class="nav-button"
          class:active={activeTab === tab.id}
          onclick={() => (activeTab = tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </nav>
  </header>

  <main class="app-main">
    {#if activeTab === "timer"}
      <Timer />
    {:else if activeTab === "log"}
      <SessionLog />
    {:else if activeTab === "chart"}
      <RhythmChart />
    {:else}
      <SettingsPanel />
    {/if}
  </main>
</div>
