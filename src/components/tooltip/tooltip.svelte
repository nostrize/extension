<script lang="ts">
  export let text;
  export let title: string | undefined = "";
  export let iconText = "❓";

  function showTooltip(e: Event) {
    const tooltip = (e.target as HTMLElement).nextElementSibling;

    if (!(tooltip instanceof HTMLElement)) {
      throw new Error("Tooltip element not found");
    }

    tooltip.style.display = "block";

    // Check if tooltip is going off the top of the screen
    const rect = tooltip.getBoundingClientRect();

    if (rect.top < 0) {
      tooltip.classList.add("below");
    } else {
      tooltip.classList.remove("below");
    }
  }

  function hideTooltip(e: Event) {
    const tooltip = (e.target as HTMLElement).nextElementSibling;

    if (!(tooltip instanceof HTMLElement)) {
      throw new Error("Tooltip element not found");
    }

    tooltip.style.display = "none";
    tooltip.classList.remove("below");
  }
</script>

<div class="tooltip-container">
  <slot name="slotTitle"></slot>

  {#if title}
    {title}
  {/if}

  <span
    class="help-icon"
    role="button"
    tabindex="0"
    on:mouseenter={showTooltip}
    on:mouseleave={hideTooltip}
    on:keydown={(e) => {
      if (e.key === "Enter") {
        showTooltip(e);
      }

      if (e.key === "Escape") {
        hideTooltip(e);
      }
    }}
  >
    {iconText}
  </span>

  <span class="tooltip below">{text}</span>
</div>

<style>
  .tooltip-container {
    position: relative;
  }

  .help-icon {
    cursor: help;
    margin-left: 5px;
    position: relative;
  }

  .tooltip {
    --tooltip-font-size: 12px;
    --tooltip-max-width: 300px;

    display: none;
    position: absolute;
    font-weight: normal;
    font-size: var(--tooltip-font-size);
    max-width: var(--tooltip-max-width);
    background-color: black;
    color: white;
    padding: 10px;
    border-radius: 5px;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    white-space: normal;
    z-index: 10;
    width: max-content;
    text-align: center;
    pointer-events: none;
  }

  .tooltip.below {
    bottom: auto;
    top: 125%; /* Position the tooltip below the help icon */
  }

  .help-icon:hover + .tooltip {
    display: block;
  }
</style>
