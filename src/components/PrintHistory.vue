<script setup>
import { computed, ref } from 'vue'
import { Search } from '@lucide/vue'
import StatusPill from './StatusPill.vue'
import { auditStatusTone, formatTimestamp } from '../data/mockData'
import { usePortal } from '../composables/usePortal'

const portal = usePortal()
const query = ref('')

const rows = computed(() =>
  portal.auditLogs.filter((row) => {
    if (!['Direct Print Execution', 'PRINT_EXECUTED', 'Blocked Print Attempt'].includes(row.eventType)) return false
    const needle = query.value.trim().toLowerCase()
    if (!needle) return true
    return [row.fileId, row.userName, row.printerId, row.detail].join(' ').toLowerCase().includes(needle)
  }),
)
</script>

<template>
  <section class="card min-w-0 overflow-hidden">
    <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Print executions and blocked attempts</h2>
        <p class="text-sm text-slate-500">Taken from the same immutable log as the audit trail.</p>
      </div>
      <label class="relative block text-xs font-semibold uppercase tracking-wide text-slate-400">
        Search
        <Search class="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-400" />
        <input v-model="query" type="search" class="field mt-1 min-w-64 pl-9" placeholder="File ID / user / printer" />
      </label>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-[860px] w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3 font-semibold">Timestamp</th>
            <th class="px-4 py-3 font-semibold">File ID</th>
            <th class="px-4 py-3 font-semibold">User</th>
            <th class="px-4 py-3 font-semibold">Event</th>
            <th class="px-4 py-3 font-semibold">Printer</th>
            <th class="px-4 py-3 font-semibold">Print Count</th>
            <th class="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-t border-slate-100">
            <td class="px-4 py-3 whitespace-nowrap">{{ formatTimestamp(row.timestamp) }}</td>
            <td class="px-4 py-3">
              <button type="button" class="font-semibold hover:text-emerald-700" @click="portal.openDocument(row.fileId)">
                {{ row.fileId }}
              </button>
            </td>
            <td class="px-4 py-3">{{ row.userName }}</td>
            <td class="px-4 py-3">
              <p>{{ row.eventType }}</p>
              <p class="text-xs text-slate-500">{{ row.detail }}</p>
            </td>
            <td class="px-4 py-3">{{ row.printerId }}</td>
            <td class="px-4 py-3 tabular-nums">{{ row.printCount }}</td>
            <td class="px-4 py-3"><StatusPill :label="row.status" :tone="auditStatusTone(row.status)" /></td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="7" class="px-4 py-16 text-center text-slate-500">No print events match this search.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
