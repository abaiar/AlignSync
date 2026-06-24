<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-6">
    <div class="text-blue-500 dark:text-blue-400 mb-6">
      <BaseIcon name="warning" :size="72" />
    </div>
    <h1 class="text-6xl font-bold text-gray-800 dark:text-gray-100 mb-2">404</h1>
    <p class="text-lg text-gray-500 dark:text-gray-400 mb-8">抱歉，您访问的页面不存在</p>
    <BaseButton variant="primary" size="lg" @click="$router.push('/')">
      返回首页
    </BaseButton>
  </div>
</template>

<script setup>
import BaseIcon from '@/components/base/BaseIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'
</script>
