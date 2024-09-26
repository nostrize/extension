<script>
  export let text = "Loading...";
  export let size = 40;
  export let strokeWidth = 2.5;
  export let strokeColor = "#fff";
  export let textColor = "#fff";
  export let textSize = "16px";
</script>

<div class="loading-spinner">
  <svg
    width={size + strokeWidth}
    height={size + strokeWidth}
    viewBox={`0 0 ${size + strokeWidth} ${size + strokeWidth}`}
    xmlns="http://www.w3.org/2000/svg"
    stroke={strokeColor}
  >
    <g fill="none" fill-rule="evenodd" stroke-width={strokeWidth}>
      <g transform={`translate(${strokeWidth / 2} ${strokeWidth / 2})`}>
        <circle stroke-opacity=".5" cx={size / 2} cy={size / 2} r={size / 2} />
        <path
          d={`M${size} ${size / 2}c0-${(size / 2) * 0.5519}-${(size / 2) * 0.4481}-${size / 2}-${size / 2}-${size / 2}`}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${size / 2} ${size / 2}`}
            to={`360 ${size / 2} ${size / 2}`}
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </g>
  </svg>
  {#if text}
    <p style="color: {textColor}; font-size: {textSize}">{text}</p>
  {/if}
</div>

<style>
  .loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
</style>
