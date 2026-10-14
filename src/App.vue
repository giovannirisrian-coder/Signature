<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ClipboardCheck, Cloud, Inbox, LogOut, Printer, ScrollText, Settings } from '@lucide/vue'
import { canAccessApprovals } from './data/mockData'
import { providePortal } from './composables/usePortal'

const portal = providePortal()
const route = useRoute()

const nav = [
  { id: 'inbox', label: 'Document Inbox', icon: Inbox, to: '/inbox' },
  { id: 'approvals', label: 'Approval Tasks', icon: ClipboardCheck, to: '/approvals', approversOnly: true },
  { id: 'history', label: 'Print History', icon: Printer, to: '/print-history' },
  { id: 'audit', label: 'Audit Trail', icon: ScrollText, to: '/audit-log' },
  { id: 'settings', label: 'Settings', icon: Settings, to: '/settings' },
]

const visibleNav = computed(() =>
  nav.filter((item) => !item.approversOnly || canAccessApprovals(portal.roleId)),
)

watch(
  () => route.fullPath,
  () => portal.syncRoute(route),
  { immediate: true },
)

const titles = {
  inbox: ['Document Inbox', 'SP Bayar files ingested from Cloud Storage'],
  detail: ['Review Document & Print', 'Check the file before it passes the one-time print gate'],
  approvals: ['Approval Tasks', 'Serial votes for reprint requests'],
  history: ['Print History', 'Direct prints and blocked attempts'],
  audit: ['Audit Trail', 'Immutable record of portal events'],
  settings: ['Settings', 'Print policy, storage sync, and approval chain'],
}

const heading = computed(() => titles[route.meta.title] || titles.inbox)

const approvalBadge = computed(
  () =>
    portal.documents.filter((file) => {
      const request = file.reprintRequest
      if (!request || request.status !== 'pending') return false
      if (portal.roleId === 'audit') return true
      return request.steps[request.currentStep].role === portal.roleId
    }).length,
)

function activeNav(id) {
  if (id === 'inbox') return route.name === 'inbox' || route.name === 'document'
  return route.name === id
}

function logout() {
  portal.logout()
}

const toastTone = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  danger: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-slate-200 bg-white text-slate-800',
}
</script>

<template>
  <RouterView v-if="route.meta.public" />
  <div v-else class="min-h-screen bg-[radial-gradient(1000px_420px_at_0%_-10%,#dbeafe,transparent),linear-gradient(#eef3f9,#e7eef6)]">
    <aside class="fixed inset-y-0 left-0 z-20 flex w-60 flex-col bg-slate-950 text-slate-300">
      <div class="flex items-center gap-3 px-5 py-6">
        <div class="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400 text-sm font-extrabold text-slate-950">SP</div>
        <div>
          <p class="font-bold leading-tight text-white">Signature Portal</p>
          <p class="text-xs text-slate-400">SP File Control</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1 px-3">
        <RouterLink
          v-for="item in visibleNav"
          :key="item.id"
          :to="item.to"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold"
          :class="activeNav(item.id) ? 'bg-white/10 text-white shadow-[inset_3px_0_0_0_#34d399]' : 'hover:bg-white/5 hover:text-white'"
          :aria-current="activeNav(item.id) ? 'page' : undefined"
          :data-testid="`nav-${item.id}`"
        >
          <component :is="item.icon" class="h-[18px] w-[18px]" />
          <span class="flex-1">{{ item.label }}</span>
          <span
            v-if="item.id === 'approvals' && approvalBadge"
            class="grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-slate-950"
          >
            {{ approvalBadge }}
          </span>
        </RouterLink>
      </nav>

      <div class="m-3 rounded-2xl bg-white/5 p-4 text-xs leading-5 text-slate-400">
        One-time print is enforced. A later copy needs every approver in the serial chain.
      </div>
    </aside>

    <div class="min-h-screen min-w-0 pl-60">
      <header class="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-slate-200/80 bg-white/90 px-5 py-3 backdrop-blur">
        <div class="min-w-0">
          <h1 class="text-lg font-bold leading-tight text-slate-900">{{ heading[0] }}</h1>
          <p class="text-sm text-slate-500">{{ heading[1] }}</p>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-3">
          <div class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <span class="relative flex h-2.5 w-2.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <Cloud class="h-4 w-4" />
            Cloud Storage Sync Active
          </div>

          <div class="flex items-center gap-3 border-l border-slate-200 pl-3">
            <div class="hidden text-right sm:block">
              <p class="text-sm font-semibold text-slate-900">{{ portal.role.name }}</p>
              <p class="text-xs text-slate-500">{{ portal.role.title }}</p>
            </div>
            <div class="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">
              {{ portal.role.initials }}
            </div>
            <button type="button" class="btn btn-ghost whitespace-nowrap" data-testid="logout-switch" @click="logout">
              <LogOut class="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main class="min-w-0 px-5 py-5">
        <RouterView />
      </main>
    </div>

    <TransitionGroup name="toast" tag="div" class="pointer-events-none fixed right-6 top-24 z-50 flex w-[22rem] flex-col gap-2" aria-live="polite">
      <button
        v-for="toast in portal.toasts"
        :key="toast.id"
        type="button"
        class="pointer-events-auto rounded-2xl border px-4 py-3 text-left text-sm font-medium shadow-lg"
        :class="toastTone[toast.tone] || toastTone.info"
        @click="portal.dismissToast(toast.id)"
      >
        {{ toast.message }}
      </button>
    </TransitionGroup>
  </div>
</template>
