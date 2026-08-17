<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAppStore } from '../store/app'
import type { Car } from '../domain/types'
import { strings } from '../strings'

// Create/edit dialog for a car: name field plus a default-car checkbox.
// Pass car = null for creating a new car.
const props = defineProps<{ car: Car | null }>()
const open = defineModel<boolean>({ required: true })

const store = useAppStore()

const name = ref('')
const isDefault = ref(false)
const showValidation = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return
  name.value = props.car?.name ?? ''
  isDefault.value = props.car?.isDefault ?? false
  showValidation.value = false
})

// Error shown at the field; the save button stays clickable (SPEC.md 9.3 style).
const nameError = computed(() =>
  showValidation.value && name.value.trim().length === 0 ? [strings.carNameRequired] : [],
)

function save() {
  if (name.value.trim().length === 0) {
    showValidation.value = true
    return
  }
  if (props.car) {
    store.updateCar(props.car.id, name.value.trim(), isDefault.value)
  } else {
    store.addCar(name.value.trim(), isDefault.value)
  }
  open.value = false
}
</script>

<template>
  <v-dialog v-model="open" max-width="400">
    <v-card rounded="lg">
      <v-card-title class="dialog-title">
        {{ car ? strings.editCar : strings.addCar }}
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="name"
          :label="strings.carName"
          :error-messages="nameError"
          variant="outlined"
          autofocus
          @keyup.enter="save"
        />
        <v-checkbox v-model="isDefault" :label="strings.defaultCar" hide-details />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="open = false">{{ strings.cancel }}</v-btn>
        <v-btn color="primary" @click="save">{{ strings.save }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.dialog-title {
  font-size: var(--sv-font-appbar-title);
  font-weight: var(--sv-font-weight-regular);
}
</style>
