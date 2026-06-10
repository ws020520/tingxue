<script setup>
import { useToastStore } from '../stores/toastStore'
const toast = useToastStore()
</script>

<template>
  <Transition name="fade">
    <div v-if="toast.message" class="toast">{{ toast.message }}</div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,.fade-leave-active{transition:.18s}.fade-enter-from,.fade-leave-to{opacity:0;transform:translateY(6px)}
</style>
