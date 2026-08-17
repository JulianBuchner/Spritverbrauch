<script setup lang="ts">
import { entryMetrics } from '../domain/stats'
import { formatEntryDate } from '../domain/format'
import type { Entry } from '../domain/types'
import MetricValue from './MetricValue.vue'

// Static example entry card for the appearance preview (SPEC.md section 9.6),
// using the sample values from SPEC.md section 9.2.
const sample: Entry = {
  id: 'sample',
  carId: 'sample',
  date: '2026-08-06',
  tripKm: 268,
  liters: 15.01,
  costCents: 3000,
  isFull: true,
  countInStats: true,
  note: '',
}

const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
  now.getDate(),
).padStart(2, '0')}`

const metrics = entryMetrics(sample)
const dateLabel = formatEntryDate(sample.date, today)
</script>

<template>
  <div class="entry-card">
    <div class="entry-card-header">
      <span class="entry-card-date">{{ dateLabel }}</span>
      <v-icon icon="mdi-dots-vertical" size="20" class="entry-card-menu" />
    </div>
    <div class="entry-card-grid">
      <MetricValue :value="sample.tripKm" unit="km" format="km" />
      <MetricValue :value="sample.liters" unit="l" format="liters" />
      <MetricValue :value="sample.costCents" unit="€" format="money" />
      <MetricValue :value="metrics.litersPer100Km" unit="l/100km" format="lPer100" />
      <MetricValue :value="metrics.centsPer100Km" unit="€/100km" format="centsPer100" />
      <MetricValue :value="metrics.centsPerLiter" unit="€/l" format="centsPerLiter" />
    </div>
  </div>
</template>

<style scoped>
.entry-card {
  background: rgb(var(--v-theme-surface-container-high));
  border-radius: var(--sv-card-radius);
  padding: var(--sv-card-padding);
}

.entry-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.entry-card-date {
  font-size: var(--sv-font-card-date);
  color: rgb(var(--v-theme-primary));
}

.entry-card-menu {
  color: rgb(var(--v-theme-on-surface-variant));
}

.entry-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  justify-items: start;
  row-gap: 4px;
  margin-top: 4px;
}
</style>
