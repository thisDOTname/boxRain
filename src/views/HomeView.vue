<script setup>
import { ref } from 'vue'
import BaseArcade from '@/components/BaseArcade.vue'
import SplashScreen from '@/components/SplashScreen.vue'

const start = ref(false)
const gameRestartCount = ref(0)

const startGame = () => {
  start.value = true
}
const restartGame = () => {
  gameRestartCount.value += 1
}

</script>

<template>
  <div>
    <SplashScreen @startGame="startGame" v-if="!start"></SplashScreen>
    <BaseArcade :key="`game-${gameRestartCount}`" @restart="restartGame" @closeGame="start = false" v-else></BaseArcade>
  </div>
</template>
