<script>
  export let text;
  export let title;

  function showTooltip(e) {
    const tooltip = e.target.nextElementSibling;
    tooltip.style.display = "block";

    // Check if tooltip is going off the top of the screen
    const rect = tooltip.getBoundingClientRect();

    if (rect.top < 0) {
      tooltip.classList.add("below");
    } else {
      tooltip.classList.remove("below");
    }
  }

  function hideTooltip(e) {
    const tooltip = e.target.nextElementSibling;
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
    on:keydown={(e) => e.key === "Enter" && showTooltip(e)}>❓</span
  >
  <span class="tooltip below">{text}</span>
</div>

<style>
  .tooltip-container {
    position: relative;
  }

  .help-icon {
    cursor: help;
    margin-left: 5px;
    position: relative; /* Make help icon the positioning context for the tooltip */
  }

  .tooltip {
    display: none;
    position: absolute;
    background-color: black;
    color: white;
    padding: 10px; /* Add padding for better readability */
    border-radius: 5px;
    bottom: 125%; /* Position the tooltip above the help icon */
    left: 50%;
    transform: translateX(-50%);
    white-space: normal; /* Allow text to wrap */
    z-index: 10;
    min-width: 50vw; /* Allow the tooltip to expand based on its content */
    max-width: 90vw; /* Maximum width to prevent it from being too wide */
    text-align: center; /* Center align text inside the tooltip */
    pointer-events: none; /* Prevent the tooltip from interfering with hover */
  }

  .tooltip.below {
    bottom: auto;
    top: 125%; /* Position the tooltip below the help icon */
  }

  .help-icon:hover + .tooltip {
    display: block;
  }
</style>
