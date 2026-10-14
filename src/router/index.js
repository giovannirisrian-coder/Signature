import { createRouter, createWebHistory } from 'vue-router'
import { canAccessApprovals, roles } from '../data/mockData'

const SESSION_KEY = 'signature-portal-role'

export function readSessionRole() {
  try {
    const id = sessionStorage.getItem(SESSION_KEY)
    return roles.some((item) => item.id === id) ? id : null
  } catch {
    return null
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/inbox' },
    {
      path: '/login',
      name: 'login',
      component: () => import('../components/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/inbox',
      name: 'inbox',
      component: () => import('../components/DocumentInbox.vue'),
      meta: { requiresAuth: true, title: 'inbox' },
    },
    {
      path: '/document/:id',
      name: 'document',
      component: () => import('../components/DocumentDetail.vue'),
      meta: { requiresAuth: true, title: 'detail' },
    },
    {
      path: '/approvals',
      name: 'approvals',
      component: () => import('../components/ApprovalTasks.vue'),
      meta: { requiresAuth: true, approver: true, title: 'approvals' },
    },
    {
      path: '/audit-log',
      name: 'audit',
      component: () => import('../components/AuditTrail.vue'),
      meta: { requiresAuth: true, title: 'audit' },
    },
    {
      path: '/print-history',
      name: 'history',
      component: () => import('../components/PrintHistory.vue'),
      meta: { requiresAuth: true, title: 'history' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../components/SettingsView.vue'),
      meta: { requiresAuth: true, title: 'settings' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/inbox' },
  ],
})

router.beforeEach((to) => {
  const roleId = readSessionRole()
  const authenticated = Boolean(roleId)

  if (to.meta.requiresAuth && !authenticated) return { path: '/login' }
  if (to.name === 'login' && authenticated) return { path: '/inbox' }
  if (to.meta.approver && !canAccessApprovals(roleId)) return { path: '/inbox' }
  return true
})

export default router
