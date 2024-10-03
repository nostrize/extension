<script lang="ts">
  export let isDirty: boolean = false;
  export let title: string;
  export let isExpanded: boolean = false;

  function toggleCollapsible(event: MouseEvent) {
    const header = event.currentTarget as HTMLElement;
    const section = header.closest(".section.collapsable");
    if (section) {
      header.classList.toggle("collapsed");
      header.classList.toggle("expanded");

      const inputContainer = section.querySelector(".input-container");
      if (inputContainer) {
        inputContainer.classList.toggle("collapsed");
        inputContainer.classList.toggle("expanded");
      }
    }
  }
</script>

<div class="section collapsable" class:dirty={isDirty}>
  <button class="collapsible-header" on:click={toggleCollapsible}>
    <h2 class:dirty={isDirty}>{title}</h2>
  </button>
  <div class={`input-container ${isExpanded ? "expanded" : "collapsed"}`}>
    <slot name="content" />
  </div>
</div>

<style>
  h2 {
    color: black;
    margin-top: 5px;
    margin-bottom: 5px;
    cursor: pointer;
  }

  .section {
    background-color: rgba(130, 80, 223, 0.1);
    padding: 10px;
    margin-bottom: 20px;
    min-width: 400px;
    max-width: 400px;
    width: 100%; /* Make sure it doesn't exceed max-width */
    box-sizing: border-box; /* Include padding in width calculation */
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .section.dirty {
    position: relative;
    background-color: rgba(223, 80, 147, 0.1);
  }

  .input-container {
    display: flex;
    margin-top: 10px;
    flex-direction: column;
  }

  .collapsible-header {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    text-align: left;
    width: 100%;
  }

  .input-container.collapsed {
    display: none;
  }

  .section h2 {
    margin: 0;
    padding: 10px 10px 10px 40px;
    position: relative;
  }

  .section h2::before {
    content: "▶"; /* The default arrow indicator */
    position: absolute;
    left: 10px; /* Adjust this value to position the indicator inside the section */
    transition: transform 0.3s ease-out;
  }

  .section h2.dirty::before {
    content: "▶"; /* The default arrow indicator */
    color: red;
    position: absolute;
    left: 10px; /* Adjust this value to position the indicator inside the section */
    transition: transform 0.3s ease-out;
  }

  .section:has(.input-container.collapsed) h2::before {
    transform: rotate(0deg); /* Indicator points right when collapsed */
  }

  .section:has(.input-container.expanded) h2::before {
    transform: rotate(90deg); /* Indicator points down when expanded */
  }
</style>
