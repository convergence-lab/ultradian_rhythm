<script lang="ts">
  import { onMount } from "svelte";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

  const kind = $derived(
    new URLSearchParams(window.location.search).get("kind") ?? "activity",
  );

  onMount(() => {
    const timeout = setTimeout(() => {
      void getCurrentWebviewWindow().close();
    }, 750);
    return () => clearTimeout(timeout);
  });
</script>

<div
  class="overlay"
  class:activity={kind === "activity"}
  class:rest={kind === "rest"}
  aria-hidden="true"
></div>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    background: transparent !important;
    overflow: hidden;
  }

  .overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    animation: screen-flash 0.7s ease-out forwards;
  }

  .overlay.activity {
    background: rgba(34, 197, 94, 0.55);
  }

  .overlay.rest {
    background: rgba(245, 158, 11, 0.55);
  }

  @keyframes screen-flash {
    0% {
      opacity: 0;
    }
    18% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
