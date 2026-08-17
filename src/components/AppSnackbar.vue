<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../store/app'

// Shows the store's snackbar queue one message at a time.
const store = useAppStore()
const current = computed(() => store.snackbarQueue[0] ?? null)

function onVisibilityChange(visible: unknown) {
  if (!visible) store.dismissSnackbar()
}
</script>

<template>
  <v-snackbar
    v-if="current"
    :key="current.id"
    :model-value="true"
    :timeout="4000"
    @update:model-value="onVisibilityChange"
  >
    {{ current.text }}
  </v-snackbar>
</template>
