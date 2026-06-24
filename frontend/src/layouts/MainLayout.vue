<template>
  <div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
    <!-- Desktop Sidebar -->
    <aside
      :class="[
        'hidden md:flex flex-col bg-slate-800 text-white transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-56',
      ]"
    >
      <div class="h-14 flex items-center justify-center border-b border-slate-700 shrink-0">
        <span v-if="!collapsed" class="text-lg font-bold tracking-wide">AlignSync</span>
        <span v-else class="text-lg font-bold">A</span>
      </div>
      <nav class="flex-1 py-4 space-y-1 overflow-y-auto">
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
          <BaseIcon :name="item.icon" :size="20" />
          <span v-if="!collapsed" class="ml-3">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- Mobile Drawer Overlay -->
    <Transition name="modal">
      <div
        v-if="appStore.mobileSidebarOpen"
        class="fixed inset-0 z-40 bg-black/50 md:hidden"
        @click="appStore.closeMobileSidebar()"
      />
    </Transition>

    <!-- Mobile Drawer -->
    <aside
      :class="[
        'fixed top-0 left-0 z-50 h-full w-56 bg-slate-800 text-white flex flex-col transition-transform duration-300 md:hidden',
        appStore.mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="h-14 flex items-center justify-between px-4 border-b border-slate-700 shrink-0">
        <span class="text-lg font-bold tracking-wide">AlignSync</span>
        <button
          class="text-slate-400 hover:text-white"
          aria-label="关闭菜单"
          @click="appStore.closeMobileSidebar()"
        >
          <BaseIcon name="close" :size="20" />
        </button>
      </div>
      <nav class="flex-1 py-4 space-y-1 overflow-y-auto">
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
          @click="appStore.closeMobileSidebar()"
        >
          <BaseIcon :name="item.icon" :size="20" />
          <span class="ml-3">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- Main Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-14 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-between px-4 md:px-6 shrink-0 border-b border-gray-200 dark:border-slate-700">
        <div class="flex items-center gap-3">
          <!-- Mobile hamburger -->
          <button
            class="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="打开菜单"
            @click="appStore.openMobileSidebar()"
          >
            <BaseIcon name="menu" :size="22" />
          </button>
          <!-- Desktop collapse toggle -->
          <button
            class="hidden md:block text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="折叠侧边栏"
            @click="appStore.toggleSidebar()"
          >
            <BaseIcon name="menu" :size="22" />
          </button>
          <BaseBreadcrumb :items="breadcrumbItems" class="hidden sm:flex" />
        </div>
        <div class="flex items-center gap-3">
          <span class="hidden lg:inline text-sm text-gray-500 dark:text-gray-400">AlignSync 车轮定位仪协同制造平台</span>
          <button
            class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            :aria-label="appStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
            @click="appStore.toggleTheme()"
          >
            <BaseIcon :name="appStore.isDark ? 'sun' : 'moon'" :size="20" />
          </button>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-auto p-4 md:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import BaseIcon from '@/components/base/BaseIcon.vue'
import BaseBreadcrumb from '@/components/base/BaseBreadcrumb.vue'

const route = useRoute()
const appStore = useAppStore()

const collapsed = computed(() => appStore.sidebarCollapsed)

const menuItems = [
  { path: '/', label: '数据大盘', icon: 'dashboard' },
  { path: '/cameras', label: '相机管理', icon: 'camera' },
  { path: '/dongles', label: '软件锁管理', icon: 'dongle' },
  { path: '/orders', label: '采购订单', icon: 'order' },
  { path: '/devices', label: '设备登记', icon: 'device' },
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const breadcrumbItems = computed(() => {
  const items = [{ label: '首页', to: '/' }]
  const bc = route.meta?.breadcrumb
  if (bc) {
    items.push({ label: bc, to: route.path })
  }
  return items
})
</script>
