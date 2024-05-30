<template>
  <div
    class="flex flex-wrap w-full h-[100vh] content-center transition duration-300 ease-out transform -translate-x-2 -translate-y-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
    @mousemove="playSplashMusic">
    <audio ref="splashMusicElement" :src="splashMusicSource" loop></audio>
    <!-- <div class="flex w-full items-center justify-center">
      <img src="../../public/assets/barrel.png" width="40px" />
      <img src="../../public/assets/barrel.png" width="40px" />
      <img src="../../public/assets/barrel.png" width="40px" />
      <img src="../../public/assets/barrel.png" width="40px" />
      <img src="../../public/assets/barrel.png" width="40px" />
    </div> -->
    <div class="flex w-full items-center justify-center">
      <div class="honk-font text-[5em] md:text-[10em] text-white lowercase font-extrabold">
        CATCH-5
      </div>
    </div>
    <div class="w-full flex items-center justify-center my-4">
      <button class="relative px-6 py-3 font-bold text-white group text-2xl" @click="$emit('startGame')">
        <span
          class="absolute inset-0 w-full h-full transition duration-300 ease-out transform -translate-x-2 -translate-y-2 bg-gradient-to-br from-pink-500 to-orange-400 group-hover:translate-x-0 group-hover:translate-y-0"></span>
        <span class="absolute inset-0 w-full h-full border-4 border-black"></span>
        <span class="relative">Start</span>
      </button>
    </div>

  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue';
// const audio = new Audio('../../public/assets/splash.mp3')
const splashMusicElement = ref(null);
const splashMusicSource = ref('../../public/assets/splash.mp3');

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
<style scoped></style>