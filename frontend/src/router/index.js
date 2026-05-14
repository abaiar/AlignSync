import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'cameras', name: 'Cameras', component: () => import('../views/CameraView.vue') },
      { path: 'dongles', name: 'Dongles', component: () => import('../views/DongleView.vue') },
      { path: 'orders', name: 'Orders', component: () => import('../views/OrderView.vue') },
      { path: 'devices', name: 'Devices', component: () => import('../views/DeviceView.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
