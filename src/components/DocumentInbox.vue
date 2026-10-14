<script setup>
import { computed, ref, watch } from 'vue'
import { CircleAlert, Clock3, Files, Printer, Search } from '@lucide/vue'
import StatusPill from './StatusPill.vue'
import { approvalStatus, formatIdr, formatLongDate, printStatus, shortHash } from '../data/mockData'
import { usePortal } from '../composables/usePortal'

const portal = usePortal()
const query = ref('')
const status = ref('all')
const from = ref('2026-10-01')
const to = ref('2026-10-14')
const page = ref(1)
const pageSize = 6

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return portal.documents.filter((file) => {
    if (from.value && file.uploadDate < from.value) return false
    if (to.value && file.uploadDate > to.value) return false
    if (status.value === 'not_printed' && file.status !== 'not_printed') return false
    if (status.value === 'printed' && file.status !== 'printed') return false
    if (status.value === 'in_approval' && file.status !== 'approval_required') return false
    if (!needle) return true
    return [file.id, file.spHash, file.vendor, file.documentName].join(' ').toLowerCase().includes(needle)
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})
const rangeLabel = computed(() => {
  if (!filtered.value.length) return 'Showing 0 of 0'
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, filtered.value.length)
  return `Showing ${start}–${end} of ${filtered.value.length}`
})

watch([query, status, from, to], () => {
  page.value = 1
})

watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})

const kpis = computed(() => [
  {
    label: 'Total files ingested',
    value: portal.kpis.total,
    hint: 'From Cloud Storage',
    icon: Files,
    valueClass: 'text-sky-700',
    iconClass: 'bg-sky-50 text-sky-700',
  },
  {
    label: 'Unprinted',
    value: portal.kpis.unprinted,
    hint: 'Print count = 0',
    icon: Clock3,
    valueClass: 'text-amber-600',
    iconClass: 'bg-amber-50 text-amber-700',
  },
  {
    label: 'Printed',
    value: portal.kpis.printed,
    hint: 'Print count ≥ 1',
    icon: Printer,
    valueClass: 'text-emerald-700',
    iconClass: 'bg-emerald-50 text-emerald-700',
  },
  {
    label: 'Pending approvals',
    value: portal.kpis.pending,
    hint: 'In the serial chain',
    icon: CircleAlert,
    valueClass: 'text-rose-700',
    iconClass: 'bg-rose-50 text-rose-700',
  },
])

function resetFilters() {
  query.value = ''
  status.value = 'all'
  from.value = '2026-10-01'
  to.value = '2026-10-14'
}
</script>

<template>
  <div class="space-y-5">
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article v-for="item in kpis" :key="item.label" class="card flex items-center gap-4 p-4">
        <div class="grid h-12 w-12 place-items-center rounded-2xl" :class="item.iconClass">
          <component :is="item.icon" class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm text-slate-500">{{ item.label }}</p>
          <p class="text-3xl font-extrabold leading-none" :class="item.valueClass">{{ item.value }}</p>
          <p class="mt-1 text-xs text-slate-400">{{ item.hint }}</p>
        </div>
      </article>
    </section>

    <section class="card min-w-0 overflow-hidden">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-end">
        <label class="block flex-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          From
          <input v-model="from" type="date" class="field mt-1" />
        </label>
        <label class="block flex-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          To
          <input v-model="to" type="date" class="field mt-1" />
        </label>
        <label class="block flex-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Status
          <select v-model="status" class="field mt-1">
            <option value="all">All</option>
            <option value="not_printed">Not Printed</option>
            <option value="printed">Printed</option>
            <option value="in_approval">In Approval</option>
          </select>
        </label>
        <label class="relative block min-w-0 flex-[1.4] text-xs font-semibold uppercase tracking-wide text-slate-400">
          Search
          <Search class="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-400" />
          <input
            v-model="query"
            type="search"
            class="field mt-1 pl-9"
            placeholder="File ID / SP Hash / Vendor"
          />
        </label>
        <button type="button" class="btn btn-ghost" @click="resetFilters">Reset</button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[920px] text-left text-[13px]">
          <thead class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-3 py-3 font-semibold">File ID / SP Hash</th>
              <th class="px-3 py-3 font-semibold">Document Name</th>
              <th class="px-3 py-3 font-semibold">Source</th>
              <th class="px-3 py-3 font-semibold">Upload Date</th>
              <th class="px-3 py-3 text-right font-semibold">Amount</th>
              <th class="px-3 py-3 font-semibold">Print Status</th>
              <th class="px-3 py-3 font-semibold">Approval Status</th>
              <th class="sticky right-0 bg-slate-50 px-3 py-3 font-semibold shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in paged" :key="file.id" class="group border-t border-slate-100 hover:bg-slate-50/80">
              <td class="px-3 py-3">
                <button
                  type="button"
                  class="font-semibold text-slate-900 hover:text-emerald-700"
                  @click="portal.openDocument(file.id)"
                >
                  {{ file.id }}
                </button>
                <p class="mt-0.5 font-mono text-[11px] text-slate-400" :title="file.spHash">{{ shortHash(file.spHash) }}</p>
              </td>
              <td class="px-3 py-3">
                <p class="font-medium text-slate-800">{{ file.documentName }}</p>
                <p class="text-xs text-slate-500">{{ file.vendor }}</p>
              </td>
              <td class="px-3 py-3 text-slate-600">{{ file.source }}</td>
              <td class="whitespace-nowrap px-3 py-3 text-slate-600">{{ formatLongDate(file.uploadDate) }}</td>
              <td class="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-slate-800">{{ formatIdr(file.amount) }}</td>
              <td class="px-3 py-3">
                <StatusPill :label="printStatus(file).label" :tone="printStatus(file).tone" />
              </td>
              <td class="px-3 py-3">
                <StatusPill :label="approvalStatus(file).label" :tone="approvalStatus(file).tone" />
              </td>
              <td class="sticky right-0 bg-white px-3 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)] group-hover:bg-slate-50">
                <button type="button" class="btn btn-dark whitespace-nowrap px-3 py-2 text-xs" @click="portal.openDocument(file.id)">
                  View & Print
                </button>
              </td>
            </tr>
            <tr v-if="!paged.length">
              <td colspan="8" class="px-4 py-16 text-center text-slate-500">
                No SP files match the current filters.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
        <span>{{ rangeLabel }}</span>
        <div class="flex items-center gap-1">
          <button type="button" class="btn btn-ghost px-3 py-1.5" :disabled="page === 1" @click="page -= 1">Previous</button>
          <button
            v-for="number in pageCount"
            :key="number"
            type="button"
            class="grid h-9 w-9 place-items-center rounded-xl text-sm font-semibold"
            :class="number === page ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'"
            @click="page = number"
          >
            {{ number }}
          </button>
          <button type="button" class="btn btn-ghost px-3 py-1.5" :disabled="page === pageCount" @click="page += 1">
            Next
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
