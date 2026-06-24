import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

export const useAppStore = defineStore('app', () => {
  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
    storageKey: 'alignsync-theme',
  })
  const toggleTheme = useToggle(isDark)

  const sidebarCollapsed = ref(false)
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const mobileSidebarOpen = ref(false)
  function openMobileSidebar() {
    mobileSidebarOpen.value = true
  }
  function closeMobileSidebar() {
    mobileSidebarOpen.value = false
  }

  return {
    isDark,
    toggleTheme,
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    openMobileSidebar,
    closeMobileSidebar,
  }
})
