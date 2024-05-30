<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { RouterView } from 'vue-router';
import { useStateStore } from '@/stores/state'

const state = useStateStore()
const splashMusicElement = ref(null);
const splashMusicSource = ref('../../public/assets/splash.mp3');

const volumeState = computed(() => state.isVolumeOn)

watch(volumeState, (value) => {
  if (value) {
    splashMusicElement.value.play();
  } else {
    splashMusicElement.value.pause();
  }
})

onMounted(() => {
  const playOnInteraction = () => {
    playSplashMusic();
    // Remove the event listener after it has been triggered
    window.removeEventListener('click', playOnInteraction);
    window.removeEventListener('keydown', playOnInteraction);
  };

  // Add event listeners to play the audio on user interaction
  window.addEventListener('click', playOnInteraction);
  window.addEventListener('keydown', playOnInteraction);
})
const playSplashMusic = () => {
  splashMusicElement.value.play();
}
</script>

<template>
  <audio ref="splashMusicElement" :src="splashMusicSource" loop></audio>
  <RouterView />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Honk&display=swap');

.honk-font {
  font-family: "Honk", system-ui;
  font-optical-sizing: auto;
  font-weight: 400;
  font-style: normal;
  font-variation-settings:
    "MORF" 15,
    "SHLN" 50;
}

#app {
  width: 100%;
  height: 100%;
}
</style>
