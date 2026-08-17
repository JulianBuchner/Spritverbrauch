<template>
  <div class="metric-grid">
    <slot />
  </div>
</template>

<style scoped>
/* Three equal, left-aligned columns in two rows (SPEC.md section 11);
   the slot carries the six MetricValue children. */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  justify-items: start;
  row-gap: 4px;
}
</style>
