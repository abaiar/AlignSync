<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="$props.class"
    aria-hidden="true"
  >
    <template v-for="(path, idx) in paths" :key="idx">
      <path :d="path" />
    </template>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  class: { type: [String, Array, Object], default: '' },
})

const iconMap = {
  dashboard: [
    'M3 3h7v7H3z',
    'M14 3h7v7h-7z',
    'M14 14h7v7h-7z',
    'M3 14h7v7H3z',
  ],
  camera: [
    'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z',
    'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  ],
  dongle: [
    'M6 3h8a2 2 0 0 1 2 2v4H4V5a2 2 0 0 1 2-2z',
    'M4 9h12v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z',
    'M10 16v5',
    'M8 21h4',
  ],
  order: [
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    'M14 2v6h6',
    'M9 13h6',
    'M9 17h6',
  ],
  device: [
    'M5 12H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2',
    'M19 12h2a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-2',
    'M5 7h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z',
    'M9 19v2h6v-2',
    'M9 11h6',
  ],
  menu: ['M3 12h18', 'M3 6h18', 'M3 18h18'],
  sun: [
    'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
    'M12 1v2',
    'M12 21v2',
    'M4.22 4.22l1.42 1.42',
    'M18.36 18.36l1.42 1.42',
    'M1 12h2',
    'M21 12h2',
    'M4.22 19.78l1.42-1.42',
    'M18.36 5.64l1.42-1.42',
  ],
  moon: ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'],
  search: [
    'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
    'M21 21l-4.35-4.35',
  ],
  'sort-asc': ['M3 6h18', 'M6 12h12', 'M9 18h6'],
  'sort-desc': ['M3 6h18', 'M6 12h12', 'M9 18h6'],
  'chevron-right': ['M9 18l6-6-6-6'],
  'chevron-left': ['M15 18l-6-6 6-6'],
  close: ['M18 6L6 18', 'M6 6l12 12'],
  check: ['M20 6L9 17l-5-5'],
  upload: [
    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
    'M17 8l-5-5-5 5',
    'M12 3v12',
  ],
  trace: [
    'M12 2a10 10 0 1 0 10 10',
    'M12 12l8-8',
    'M12 12V2',
  ],
  plus: ['M12 5v14', 'M5 12h14'],
  trash: [
    'M3 6h18',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M10 11v6',
    'M14 11v6',
  ],
  info: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M12 16v-4',
    'M12 8h.01',
  ],
  warning: [
    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    'M12 9v4',
    'M12 17h.01',
  ],
  error: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M15 9l-6 6',
    'M9 9l6 6',
  ],
  success: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M9 12l2 2 4-4',
  ],
  logout: [
    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
    'M16 17l5-5-5-5',
    'M21 12H9',
  ],
  refresh: [
    'M23 4v6h-6',
    'M1 20v-6h6',
    'M3.51 9a9 9 0 0 1 14.85-3.36L23 10',
    'M20.49 15a9 9 0 0 1-14.85 3.36L1 14',
  ],
}

const paths = computed(() => iconMap[props.name] || [])
</script>
