import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useStateStore = defineStore('state', () => {
  const isVolumeOn = ref(true)
  function toggleVolume() {
    isVolumeOn.value = !isVolumeOn.value
  }

  return { isVolumeOn, toggleVolume }
})
