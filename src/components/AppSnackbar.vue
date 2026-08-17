<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../store/app'

// Shows the store's snackbar queue one message at a time; a message may
// carry an optional action (e.g. undo after deleting an entry).
const store = useAppStore()
const current = computed(() => store.snackbarQueue[0] ?? null)

function onVisibilityChange(visible: unknown) {
  if (!visible) store.dismissSnackbar()
}

function onAction() {
  current.value?.action?.onAction()
  store.dismissSnackbar()
}
</script>

<template>
  <v-snackbar
    v-if="current"
    :key="current.id"
    :model-value="true"
    :timeout="current.timeoutMs"
    @update:model-value="onVisibilityChange"
  >
    {{ current.text }}
    <template v-if="current.action" #actions>
      <v-btn variant="text" color="primary" @click="onAction">
        {{ current.action.label }}
      </v-btn>
    </template>
  </v-snackbar>
</template>
