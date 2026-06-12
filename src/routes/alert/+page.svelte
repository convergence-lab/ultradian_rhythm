<script lang="ts">
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

  const kind = $derived(
    new URLSearchParams(window.location.search).get("kind") ?? "activity",
  );

  const title = $derived(
    kind === "activity" ? "Activity complete" : "Rest complete",
  );

  const message = $derived(
    kind === "activity"
      ? "Great work. Time for a restorative break."
      : "Break finished. Start the next focus block when ready.",
  );

  async function dismiss() {
    await getCurrentWebviewWindow().close();
  }
</script>

<div class="alert-shell">
  <div class="alert-card" class:activity={kind === "activity"} class:rest={kind === "rest"}>
    <p class="eyebrow">Phase ended</p>
    <h1>{title}</h1>
    <p class="message">{message}</p>
    <button class="btn-dismiss" onclick={dismiss}>OK</button>
  </div>
</div>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    background: transparent !important;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  }

  .alert-shell {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(15, 20, 25, 0.45);
  }

  .alert-card {
    width: min(100%, 380px);
    border-radius: 14px;
    padding: 1.35rem 1.5rem 1.25rem;
    border: 1px solid var(--accent-border, #2f3f56);
    background: #1a2332;
    color: #e8eef7;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  }

  .alert-card.activity {
    --accent: #22c55e;
    --accent-border: rgba(34, 197, 94, 0.45);
  }

  .alert-card.rest {
    --accent: #f59e0b;
    --accent-border: rgba(245, 158, 11, 0.45);
  }

  .eyebrow {
    margin: 0 0 0.35rem;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: 1.35rem;
  }

  .message {
    margin: 0 0 1.1rem;
    color: #94a3b8;
    line-height: 1.5;
  }

  .btn-dismiss {
    width: 100%;
    border: none;
    border-radius: 10px;
    padding: 0.65rem 1rem;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    color: #0f1419;
    background: var(--accent);
  }

  .btn-dismiss:hover {
    filter: brightness(1.05);
  }
</style>
