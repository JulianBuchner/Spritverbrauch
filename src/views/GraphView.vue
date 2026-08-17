<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import {
  Chart,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Tooltip,
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import { GRAPH_METRICS, graphPoints, isDerivedMetric } from '../domain/graph'
import type { GraphMetric } from '../domain/graph'
import {
  formatCentsPer100,
  formatCentsPerLiter,
  formatEntryDate,
  formatKm,
  formatLPer100,
  formatLiters,
  formatMoney,
  todayLocalDate,
} from '../domain/format'
import { useAppStore } from '../store/app'
import { strings } from '../strings'

// Graph view per SPEC.md section 9.4 and docs/reference/graphs*.jpeg.
Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip)
Chart.defaults.font.family = "Roboto, 'Segoe UI', system-ui, -apple-system, sans-serif"

// Money metrics carry cents, so their formatters divide by 100 at display
// time — the same convention as everywhere else in the app.
const METRIC_CONFIG: Record<
  GraphMetric,
  { title: string; unit: string; format: (value: number | null) => string }
> = {
  tripKm: { title: strings.metricTripKm, unit: 'km', format: formatKm },
  liters: { title: strings.metricLiters, unit: 'l', format: formatLiters },
  cost: { title: strings.metricCost, unit: '€', format: formatMoney },
  consumption: { title: strings.metricConsumption, unit: 'l/100km', format: formatLPer100 },
  costPer100Km: { title: strings.metricCostPer100Km, unit: '€/100km', format: formatCentsPer100 },
  costPerLiter: { title: strings.metricCostPerLiter, unit: '€/l', format: formatCentsPerLiter },
}

const store = useAppStore()
const router = useRouter()
const theme = useTheme()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'line', { x: number; y: number | null }[]> | null = null

const config = computed(() => METRIC_CONFIG[store.graphMetric])

const points = computed(() =>
  graphPoints(
    store.database.entries.filter((entry) => entry.carId === store.activeCarId),
    store.graphMetric,
  ),
)

// Empty state below two plottable (non-null) points.
const hasEnoughPoints = computed(
  () => points.value.filter((point) => point.value !== null).length >= 2,
)

function rebuildChart() {
  chart?.destroy()
  chart = null
  if (!hasEnoughPoints.value || !canvas.value) return

  const colors = theme.current.value.colors
  const metricConfig = config.value
  const currentPoints = points.value
  const today = todayLocalDate()

  chart = new Chart(canvas.value, {
    type: 'line',
    data: {
      datasets: [
        {
          // y: null (not 0) makes the line break at excluded entries;
          // spanGaps: false keeps the gap visible instead of bridging it —
          // the crash-to-zero in docs/reference/graphs.jpeg is exactly the
          // bug this avoids.
          data: currentPoints.map((point) => ({ x: point.dateMs, y: point.value })),
          spanGaps: false,
          borderColor: colors.primary,
          borderWidth: 2,
          fill: false,
          pointRadius: currentPoints.length > 40 ? 0 : 2.5,
          pointBackgroundColor: colors.primary,
          pointHitRadius: 12,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: {
          type: 'time',
          time: {
            minUnit: 'month',
            displayFormats: { month: 'MM/yy', quarter: 'MM/yy', year: 'MM/yy' },
          },
          ticks: {
            color: colors['on-surface-variant'],
            maxRotation: 0,
            autoSkip: true,
            autoSkipPadding: 16,
          },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          beginAtZero: !isDerivedMetric(store.graphMetric),
          ticks: {
            color: colors['on-surface-variant'],
            callback: (value) => metricConfig.format(Number(value)),
          },
          grid: { color: colors['outline-variant'] },
          border: { display: false },
        },
      },
      plugins: {
        tooltip: {
          displayColors: false,
          callbacks: {
            title: (items) =>
              items.length > 0 ? formatEntryDate(currentPoints[items[0].dataIndex].date, today) : '',
            label: (item) =>
              `${metricConfig.format(currentPoints[item.dataIndex].value)}${metricConfig.unit}`,
          },
        },
      },
    },
  })
}

onMounted(rebuildChart)
// flush: 'post' so the v-if around the canvas has settled before rebuilding.
watch([points, () => theme.current.value.colors], rebuildChart, { flush: 'post' })
onBeforeUnmount(() => chart?.destroy())
</script>

<template>
  <v-app-bar flat>
    <v-btn icon="mdi-arrow-left" @click="router.push('/')" />
    <v-app-bar-title class="appbar-title">{{ config.title }}</v-app-bar-title>
    <template #append>
      <v-menu location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn icon="mdi-tune-variant" v-bind="menuProps" />
        </template>
        <v-list>
          <v-list-item
            v-for="metric in GRAPH_METRICS"
            :key="metric"
            @click="store.setGraphMetric(metric)"
          >
            <v-list-item-title class="metric-item">
              {{ METRIC_CONFIG[metric].title }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-app-bar>

  <v-main class="graph-main">
    <div v-if="hasEnoughPoints" class="chart-wrap">
      <canvas ref="canvas" />
    </div>
    <p v-else class="empty-hint">{{ strings.graphEmptyHint }}</p>
  </v-main>
</template>

<style scoped>
/* v-main pads for the app bar, so a full-viewport height leaves the chart
   exactly the space between app bar and screen bottom — no inner scrolling. */
.graph-main {
  height: 100vh;
  height: 100dvh;
}

.chart-wrap {
  position: relative;
  height: 100%;
  padding: 12px var(--sv-page-padding-x) 8px;
}

.metric-item {
  font-size: var(--sv-font-list-item);
}

.empty-hint {
  padding: 24px var(--sv-page-padding-x);
  font-size: var(--sv-font-list-item);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
