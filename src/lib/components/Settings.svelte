<script lang="ts">
  import { resetSettings, saveSettings, settings } from "$lib/stores/settings";
  import type { Settings } from "$lib/types";

  let draft = $state<Settings>({ ...$settings });

  $effect(() => {
    draft = { ...$settings };
  });

  async function applySettings() {
    await saveSettings({
      activityMinutes: Math.max(5, Math.min(180, draft.activityMinutes)),
      restMinutes: Math.max(5, Math.min(60, draft.restMinutes)),
      autoStart: draft.autoStart,
      notificationsEnabled: draft.notificationsEnabled,
      flashOnPhaseEnd: draft.flashOnPhaseEnd,
      popupOnPhaseEnd: draft.popupOnPhaseEnd,
    });
  }

  async function restoreDefaults() {
    await resetSettings();
  }
</script>

<section class="panel">
  <h2 class="panel-title">Settings</h2>

  <div class="grid-2">
    <div class="field">
      <label for="activity-minutes">Activity length (minutes)</label>
      <input
        id="activity-minutes"
        type="number"
        min="5"
        max="180"
        bind:value={draft.activityMinutes}
      />
    </div>

    <div class="field">
      <label for="rest-minutes">Rest length (minutes)</label>
      <input
        id="rest-minutes"
        type="number"
        min="5"
        max="60"
        bind:value={draft.restMinutes}
      />
    </div>
  </div>

  <div class="toggle-list">
    <label class="toggle">
      <input type="checkbox" bind:checked={draft.autoStart} />
      <span>Automatically start the next activity after rest</span>
    </label>

    <label class="toggle">
      <input type="checkbox" bind:checked={draft.notificationsEnabled} />
      <span>Desktop notifications on phase changes</span>
    </label>

    <label class="toggle">
      <input type="checkbox" bind:checked={draft.flashOnPhaseEnd} />
      <span>Flash the screen when a phase ends</span>
    </label>

    <label class="toggle">
      <input type="checkbox" bind:checked={draft.popupOnPhaseEnd} />
      <span>Show a popup when a phase ends</span>
    </label>
  </div>

  <div class="actions">
    <button class="btn btn-primary" onclick={applySettings}>Save settings</button>
    <button class="btn" onclick={restoreDefaults}>Restore defaults</button>
  </div>

  <p class="muted hint">
    Default ultradian rhythm is 90 minutes of focused activity followed by 20 minutes of rest.
  </p>
</section>

<style>
  .toggle-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 1rem 0;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .hint {
    margin-top: 1rem;
    font-size: 0.85rem;
  }
</style>
