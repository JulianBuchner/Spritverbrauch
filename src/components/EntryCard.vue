<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { entryMetrics } from '../domain/stats'
import { formatEntryDate } from '../domain/format'
import type { Entry } from '../domain/types'
import { useAppStore } from '../store/app'
import { strings } from '../strings'
import MetricGrid from './MetricGrid.vue'
import MetricValue from './MetricValue.vue'

// One fuel entry as a rounded card (SPEC.md section 9.2): date header with
// the ⋮ menu, the stats-exclusion marker when applicable, and the six
// metric values below. With `preview` the ⋮ is a plain inert icon — used by
// the appearance preview, where editing and deleting make no sense.
const props = withDefaults(defineProps<{ entry: Entry; today: string; preview?: boolean }>(), {
  preview: false,
})

const store = useAppStore()
const router = useRouter()

const dateLabel = computed(() => formatEntryDate(props.entry.date, props.today))
const metrics = computed(() => entryMetrics(props.entry))

function edit() {
  router.push(`/entry/${props.entry.id}`)
}

function remove() {
  store.deleteEntry(props.entry.id)
}
</script>

<template>
  <div class="entry-card">
    <div class="entry-card-header">
      <span class="entry-card-date">{{ dateLabel }}</span>
      <div class="entry-card-actions">
        <span v-if="!entry.countInStats" class="entry-card-marker">
          <v-icon icon="mdi-minus-circle-outline" size="18" />
          <v-tooltip activator="parent" location="top">{{ strings.notInAverages }}</v-tooltip>
        </span>
        <v-icon v-if="preview" icon="mdi-dots-vertical" size="20" class="entry-card-menu-icon" />
        <v-btn v-else icon variant="text" density="comfortable" size="small" class="entry-card-menu">
          <v-icon icon="mdi-dots-vertical" size="20" />
          <v-menu activator="parent">
            <v-list density="compact">
              <v-list-item :title="strings.edit" @click="edit" />
              <v-list-item :title="strings.delete" @click="remove" />
            </v-list>
          </v-menu>
        </v-btn>
      </div>
    </div>
    <MetricGrid>
      <MetricValue :value="entry.tripKm" unit="km" format="km" />
      <MetricValue :value="entry.liters" unit="l" format="liters" />
      <MetricValue :value="entry.costCents" unit="€" format="money" />
      <MetricValue :value="metrics.litersPer100Km" unit="l/100km" format="lPer100" />
      <MetricValue :value="metrics.centsPer100Km" unit="€/100km" format="centsPer100" />
      <MetricValue :value="metrics.centsPerLiter" unit="€/l" format="centsPerLiter" />
    </MetricGrid>
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

.entry-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.entry-card-marker,
.entry-card-menu,
.entry-card-menu-icon {
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Keep the compact icon button from inflating the header row height. */
.entry-card-menu {
  margin: -6px -8px -6px 0;
}

.entry-card-marker {
  display: inline-flex;
  align-items: center;
}
</style>
