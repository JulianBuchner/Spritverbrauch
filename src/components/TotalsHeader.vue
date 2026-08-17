<script setup lang="ts">
import { computed } from 'vue'
import { carAverages, carSums } from '../domain/stats'
import type { Entry } from '../domain/types'
import { strings } from '../strings'
import MetricGrid from './MetricGrid.vue'
import MetricValue from './MetricValue.vue'

// Totals block above the entry list (SPEC.md section 9.2): sums over all
// entries, averages only over the included ones, plus the sample-size hint
// when those two populations differ.
const props = defineProps<{ entries: Entry[] }>()

const sums = computed(() => carSums(props.entries))
const averages = computed(() => carAverages(props.entries))
</script>

<template>
  <div class="totals-header">
    <div class="totals-label">{{ strings.totalsLabel }}</div>
    <MetricGrid>
      <MetricValue :value="sums.km" unit="km" format="km" />
      <MetricValue :value="sums.liters" unit="l" format="liters" />
      <MetricValue :value="sums.cents" unit="€" format="money" />
      <MetricValue :value="averages.litersPer100Km" unit="l/100km" format="lPer100" />
      <MetricValue :value="averages.centsPer100Km" unit="€/100km" format="centsPer100" />
      <MetricValue :value="averages.centsPerLiter" unit="€/l" format="centsPerLiter" />
    </MetricGrid>
    <div v-if="averages.includedCount < averages.totalCount" class="totals-sample-hint">
      {{ strings.sampleHint(averages.includedCount, averages.totalCount) }}
    </div>
  </div>
</template>

<style scoped>
.totals-label {
  font-size: var(--sv-font-total-label);
  color: rgb(var(--v-theme-primary));
  margin-bottom: 4px;
}

.totals-sample-hint {
  font-size: var(--sv-font-label);
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 4px;
}
</style>
