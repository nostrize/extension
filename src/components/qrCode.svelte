<script lang="ts">
  import { toString as toSvgString } from "qrcode/lib/browser.js";
  import { onMount } from "svelte";

  import Loading from "./loading.svelte";

  export let value = "";
  export let width = 256;

  let svg: string | null = null;

  async function generateQRCode() {
    svg = await toSvgString(value);
  }

  $: if (value) {
    generateQRCode();
  }

  onMount(() => {
    generateQRCode();
  });
</script>

{#if svg}
  <div
    id="qrcode"
    style="width: {width}px; height: {width}px; display: flex; justify-content: center; align-items: center;"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html svg}
  </div>
{:else}
  <Loading size={width} />
{/if}
