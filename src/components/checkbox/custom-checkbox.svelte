<script>
  export let id;
  export let text;
  export let checked;
  export let onclick;

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
  <button class="custom-checkbox" on:click={handleClick} class:checked for={id}
  ></button>
  <button type="button" on:click={handleClick}>{text}</button>
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
    border: 2px solid #8250df;
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
    background-color: #8250df;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  /* Align the span to the left */
  .checkbox-container button {
    display: flex;
    align-items: center;
  }
</style>
