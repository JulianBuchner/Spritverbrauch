<script setup lang="ts">
import { useRouter } from 'vue-router'
import { strings } from '../strings'

// Graph placeholder; the chart comes in a later subtask.
const router = useRouter()
</script>

<template>
  <v-app-bar flat>
    <v-btn icon="mdi-arrow-left" @click="router.push('/')" />
    <v-app-bar-title class="appbar-title">{{ strings.graph }}</v-app-bar-title>
  </v-app-bar>

  <v-main>
    <p class="placeholder">{{ strings.graphPlaceholder }}</p>
  </v-main>
</template>

<style scoped>
.placeholder {
  padding: 24px var(--sv-page-padding-x);
  font-size: var(--sv-font-list-item);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
