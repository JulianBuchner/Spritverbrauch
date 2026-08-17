<script setup lang="ts">
import { computed } from 'vue'
import {
  formatCentsPer100,
  formatCentsPerLiter,
  formatKm,
  formatLiters,
  formatLPer100,
  formatMoney,
} from '../domain/format'

// The visual signature of the app (SPEC.md section 11): a large number with
// the half-sized unit glued on, sharing a common baseline.
const props = defineProps<{
  value: number | null
  unit: string
  format: 'km' | 'liters' | 'money' | 'lPer100' | 'centsPer100' | 'centsPerLiter'
}>()

const formatters = {
  km: formatKm,
  liters: formatLiters,
  money: formatMoney,
  lPer100: formatLPer100,
  centsPer100: formatCentsPer100,
  centsPerLiter: formatCentsPerLiter,
} as const

const formatted = computed(() => formatters[props.format](props.value))
</script>

<template>
  <span class="mv">
    <span class="mv-val">{{ formatted }}</span>
    <span class="mv-unit">{{ unit }}</span>
  </span>
</template>

<style scoped>
.mv {
  display: inline-flex;
  align-items: baseline;
}

.mv-val {
  font-size: var(--sv-font-metric-value);
  font-weight: var(--sv-font-weight-regular);
  color: rgb(var(--v-theme-on-surface));
}

/* Same color as the value, half the size — measured from
   docs/reference/main_window.jpeg. */
.mv-unit {
  font-size: var(--sv-font-metric-unit);
  color: rgb(var(--v-theme-on-surface));
}
</style>
