<script lang="ts">
  export let id: string | null = null;
  export let text: string | null = null;
  export let checked: boolean;
  export let onclick: ((checked: boolean) => void) | null = null;
  export let tooltip = "";

  function handleClick() {
    checked = !checked;

    if (onclick) {
      onclick(checked);
    }
  }
</script>

<div class="checkbox-container">
  <input
    type="checkbox"
    {id}
    bind:checked
    on:click={() => {
      if (onclick) {
        onclick(checked);
      }
    }}
  />
  <button
    class="custom-checkbox"
    on:click={handleClick}
    class:checked
    data-title={tooltip}
    class:hastooltip={tooltip !== ""}
  ></button>
  <button
    type="button"
    on:click={handleClick}
    data-title={tooltip}
    class:hastooltip={tooltip !== ""}
  >
    {#if text}
      {text}
    {/if}
  </button>
</div>

<style>
  /* Container for the checkbox and label */
  .checkbox-container {
    display: flex;
    align-items: center;
  }

  /* Hide the default checkbox */
  .checkbox-container input[type="checkbox"] {
    display: none;
  }

  .checkbox-container button {
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    text-align: left;
  }

  /* Custom checkbox */
  .checkbox-container .custom-checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(130, 80, 223, 1);
    border-radius: 3px;
    position: relative;
    cursor: pointer;
    margin-right: 10px;
  }

  /* Checkmark for the checked state */
  .checkbox-container .custom-checkbox.checked::before {
    content: "";
    width: 10px;
    height: 10px;
    background-color: rgba(130, 80, 223, 0.7);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  /* Change background color on hover */
  .checkbox-container:hover .custom-checkbox.checked::before {
    background-color: rgba(130, 80, 223, 1);
  }

  /* Align the span to the left */
  .checkbox-container button {
    display: flex;
    align-items: center;
  }

  /* Custom tooltip styles */
  .checkbox-container button {
    position: relative;
  }

  .checkbox-container button.hastooltip:hover::after {
    content: attr(data-title);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #333;
    color: #fff;
    margin-bottom: 5px;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
    white-space: nowrap;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .checkbox-container button.hastooltip:hover::after {
    opacity: 1;
  }
</style>
