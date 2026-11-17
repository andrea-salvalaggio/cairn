<!-- Pile mark (three stones, same shapes as the wallpaper) beside "Cairn" outlined from Geist Bold; the stones' base sits on the text baseline. -->
<template>
  <svg class="cairn-logo" viewBox="0 14 130 32" role="img" aria-label="Cairn">
    <defs>
      <!-- Roughens the letters a little less than the stones, like a block print. -->
      <filter id="cairn-logo-print" x="-5%" y="-10%" width="110%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.9" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
    <!-- Smaller than the letters: the ochre tip rises just above the C. -->
    <svg y="15" width="32.5" height="29.9" viewBox="78 112 250 230">
      <g fill="currentColor" stroke="currentColor" stroke-width="6" stroke-linejoin="round">
        <path transform="translate(140 290)" d="M-53.7 50L-32.2 17.2L-15.5 -7.4L3.1 -41L18.8 -7.9L34 21.4L53.7 50L0.9 47.4Z" />
        <path transform="translate(260 290)" d="M-60.8 50L-37.9 15.4L-17.2 -13.5L9.7 -45.3L27.3 -13.4L41.8 16.5L60.8 50L0.9 50.1Z" />
        <path class="cairn-logo-top" transform="translate(200 178)" d="M-52.8 50L-32.5 13.6L-6.1 -19.7L18.4 -58.1L30.3 -22.1L43.5 14L52.8 50L-1.4 48.4Z" />
      </g>
    </svg>
    <path
      transform="translate(40 44.6)" fill="currentColor" filter="url(#cairn-logo-print)"
      d="M13.5 0.58Q10.01 0.58 7.31 -1.01Q4.61 -2.59 3.06 -5.58Q1.51 -8.57 1.51 -12.74Q1.51 -16.81 3.01 -19.82Q4.5 -22.82 7.22 -24.48Q9.94 -26.14 13.61 -26.14Q18.61 -26.14 21.38 -23.67Q24.16 -21.2 24.98 -16.63L19.3 -16.42Q18.86 -18.83 17.42 -20.18Q15.98 -21.53 13.61 -21.53Q10.55 -21.53 8.86 -19.13Q7.16 -16.74 7.16 -12.74Q7.16 -8.71 8.89 -6.37Q10.62 -4.03 13.57 -4.03Q16.13 -4.03 17.57 -5.49Q19.01 -6.95 19.37 -9.54L25.09 -9.32Q24.3 -4.64 21.4 -2.03Q18.5 0.58 13.5 0.58ZM33.62 0.43Q30.6 0.43 28.73 -0.95Q26.86 -2.34 26.86 -4.82Q26.86 -7.38 28.46 -8.77Q30.06 -10.15 33.19 -10.8L39.42 -12.02Q39.42 -15.8 36.14 -15.8Q33.16 -15.8 32.62 -13.03L27.18 -13.28Q27.72 -16.45 30.04 -18.09Q32.36 -19.73 36.14 -19.73Q40.46 -19.73 42.64 -17.66Q44.82 -15.59 44.82 -11.66L44.82 -5.08Q44.82 -4.25 45.09 -3.98Q45.36 -3.71 45.9 -3.71L46.44 -3.71L46.44 0Q46.19 0.07 45.63 0.14Q45.07 0.22 44.53 0.22Q43.06 0.22 41.89 -0.41Q40.72 -1.04 40.36 -2.77L40.28 -2.95Q39.56 -1.4 37.84 -0.49Q36.11 0.43 33.62 0.43ZM34.92 -3.28Q36.94 -3.28 38.18 -4.46Q39.42 -5.65 39.42 -7.7L39.42 -8.64L35.03 -7.7Q32.4 -7.2 32.4 -5.33Q32.4 -3.28 34.92 -3.28ZM48.38 0L48.38 -19.3L53.78 -19.3L53.78 0ZM48.28 -21.67L48.28 -25.99L53.86 -25.99L53.86 -21.67ZM57.6 0L57.6 -19.3L62.71 -19.3L62.86 -15.44Q63.43 -17.46 64.55 -18.38Q65.66 -19.3 67.43 -19.3L69.19 -19.3L69.19 -14.83L67.43 -14.83Q65.16 -14.83 64.08 -13.91Q63 -13 63 -10.84L63 0ZM72 0L72 -19.3L76.86 -19.3L76.97 -16.09Q77.76 -18.07 79.27 -18.9Q80.78 -19.73 82.69 -19.73Q85.82 -19.73 87.53 -17.75Q89.24 -15.77 89.24 -12.42L89.24 0L83.84 0L83.84 -10.62Q83.84 -12.92 83.21 -14.18Q82.58 -15.44 80.89 -15.44Q79.2 -15.44 78.3 -14.18Q77.4 -12.92 77.4 -10.62L77.4 0Z"
    />
  </svg>
</template>

<style lang="scss" scoped>
.cairn-logo {
  display: block;
  overflow: visible;
  // 32 units tall for 36-unit letters: this keeps the letters at the large title size.
  height: calc($font-size-large-title * 32 / 36);
  width: auto;
}

.cairn-logo-top {
  fill: $tint;
  stroke: $tint;
}
</style>
