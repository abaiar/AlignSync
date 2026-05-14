<template>
  <div class="flex h-screen bg-gray-100">
    <aside
      :class="[
        'bg-slate-800 text-white transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-56',
      ]"
    >
      <div class="h-14 flex items-center justify-center border-b border-slate-700">
        <span v-if="!collapsed" class="text-lg font-bold tracking-wide">AlignSync</span>
        <span v-else class="text-lg font-bold">A</span>
      </div>
      <nav class="flex-1 py-4 space-y-1">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center px-4 py-3 text-sm transition-colors',
            isActive(item.path)
              ? 'bg-slate-700 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white',
          ]"
        >
          <span class="text-lg" v-html="item.icon"></span>
          <span v-if="!collapsed" class="ml-3">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="h-14 bg-white shadow-sm flex items-center justify-between px-6">
        <button
          @click="appStore.toggleSidebar()"
          class="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500">AlignSync 车轮定位仪协同制造平台</span>
        </div>
      </header>

      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'

const route = useRoute()
const appStore = useAppStore()

const collapsed = computed(() => appStore.sidebarCollapsed)

const menuItems = [
  { path: '/', label: '数据大盘', icon: '&#9632;' },
  { path: '/cameras', label: '相机管理', icon: '&#9635;' },
  { path: '/dongles', label: '软件锁管理', icon: '&#9830;' },
  { path: '/orders', label: '采购订单', icon: '&#9998;' },
  { path: '/devices', label: '设备登记', icon: '&#9881;' },
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
