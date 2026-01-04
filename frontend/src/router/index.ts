import AuthLayout from '@/layouts/AuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'login',
          component: () => import('@/features/authentication/views/LoginView.vue'),
          meta: { requiresGuest: true },
        },
      ],
    },
    {
      path: '/register',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'register',
          component: () => import('@/features/authentication/views/RegisterView.vue'),
          meta: { requiresGuest: true },
        },
      ],
    },
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/features/dashboard/views/DashboardView.vue'),
        },
        {
          path: 'learn',
          name: 'learn',
          component: () => import('@/features/learning/views/LearningSessionView.vue'),
        },
        {
          path: 'learn/summary',
          name: 'learn-summary',
          component: () => import('@/features/learning/views/LearningSummaryView.vue'),
        },
        {
          path: 'flashcards',
          name: 'flashcards',
          component: () => import('@/features/flashcards/views/FlashcardsView.vue'),
        },
        {
          path: 'generate',
          name: 'generate',
          component: () => import('@/features/generation/views/GenerateView.vue'),
        },
        {
          path: 'review/:eventId',
          name: 'review',
          component: () => import('@/features/generation/views/ReviewView.vue'),
        },
        {
          path: 'statistics',
          name: 'statistics',
          component: () => import('@/features/statistics/views/StatisticsView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('authToken')
  const isAuthenticated = !!token

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ path: '/login' })
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next({ path: '/' })
  } else {
    next()
  }
})

export default router
