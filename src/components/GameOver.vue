<template>
  <transition name="modal">
    <div v-if="props.show" class="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-20">
      <div class="bg-white p-6 rounded-lg shadow-lg w-3/4 md:w-1/2">
        <div class="flex w-full items-center justify-center text-center honk-font text-8xl">
          Game over
        </div>
        <div class="flex w-full items-center justify-center text-4xl py-8">
          <template v-for="i in props.score" :key="`remaining_bomb_${i}`">
            <img src="../../public/assets/barrel.png" class="mx-1" width="40px" />
          </template>
          <div class=" text-8xl my-4" v-if="!props.score">
            💩
          </div>
        </div>
        <div class="w-full flex items-center justify-center my-4">
          <button class="relative px-6 py-3 font-bold text-white group text-2xl" @click="$emit('again')">
            <span
              class="absolute inset-0 w-full h-full transition duration-300 ease-out transform -translate-x-2 -translate-y-2 bg-gradient-to-br from-pink-500 to-orange-400 group-hover:translate-x-0 group-hover:translate-y-0"></span>
            <span class="absolute inset-0 w-full h-full border-4 border-black"></span>
            <span class="relative">Try again</span>
          </button>
        </div>
        <div>
          <slot></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps(['show', 'score'])
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter,
.modal-leave-to

/* .modal-leave-active in <2.1.8 */
  {
  opacity: 0;
}
</style>
