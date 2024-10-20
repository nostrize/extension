<script lang="ts">
  export let onClick: () => void;
  export let label = "Remove";
</script>

<button
  class="settings-button remove-btn"
  on:click={onClick}
  aria-label={label}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path
      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
    ></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
</button>

<style>
  .remove-btn {
    background-color: var(--red-button-bgcolor);
    color: var(--red-button-color);
  }

  .remove-btn:hover {
    background-color: var(--red-button-bgcolor-hover);
  }
</style>
