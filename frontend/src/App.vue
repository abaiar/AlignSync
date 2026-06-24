<template>
  <router-view v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </router-view>
  <BaseToastContainer />
  <BaseConfirmContainer />
</template>

<script setup>
import BaseToastContainer from '@/components/base/BaseToastContainer.vue'
import BaseConfirmContainer from '@/components/base/BaseConfirmContainer.vue'
</script>
