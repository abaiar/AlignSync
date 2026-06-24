import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: { title: '数据大盘', icon: 'dashboard', breadcrumb: '数据大盘' },
      },
      {
        path: 'cameras',
        name: 'Cameras',
        component: () => import('../views/CameraView.vue'),
        meta: { title: '相机管理', icon: 'camera', breadcrumb: '相机管理' },
      },
      {
        path: 'dongles',
        name: 'Dongles',
        component: () => import('../views/DongleView.vue'),
        meta: { title: '软件锁管理', icon: 'dongle', breadcrumb: '软件锁管理' },
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('../views/OrderView.vue'),
        meta: { title: '采购订单', icon: 'order', breadcrumb: '采购订单' },
      },
      {
        path: 'devices',
        name: 'Devices',
        component: () => import('../views/DeviceView.vue'),
        meta: { title: '设备登记', icon: 'device', breadcrumb: '设备登记' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '页面未找到' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  const title = to.meta?.title
  if (title) {
    document.title = `${title} - AlignSync`
  }
})

export default router
