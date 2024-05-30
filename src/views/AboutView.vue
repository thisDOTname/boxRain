<template>
  <SplashScreen @startGame="startGame"></SplashScreen>
</template>

<script setup>
import SplashScreen from '@/components/SplashScreen.vue'

const startGame = () => {
  console.log('TIME TO PLAY THE GAME');
}
</script>

<style></style>
