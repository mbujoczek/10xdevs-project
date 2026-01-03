import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/authentication/views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('authToken')
  const isAuthenticated = !!token

  if (to.meta.requiresGuest && isAuthenticated) {
    next({ path: '/' })
  } else {
    next()
  }
})

export default router
