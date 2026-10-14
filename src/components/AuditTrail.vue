<script setup>
import { computed, ref, watch } from 'vue'
import { Search } from '@lucide/vue'
import StatusPill from './StatusPill.vue'
import { auditStatusTone, eventTypes, formatTimestamp, shortHash } from '../data/mockData'
import { usePortal } from '../composables/usePortal'

const portal = usePortal()
const query = ref('')
const eventType = ref('all')
const page = ref(1)
const pageSize = 8

const filtered = computed(() =>
  portal.auditLogs.filter((row) => {
    if (eventType.value !== 'all' && row.eventType !== eventType.value) return false
    const needle = query.value.trim().toLowerCase()
    if (!needle) return true
    return [row.fileId, row.spHash, row.id, row.userId, row.userName].join(' ').toLowerCase().includes(needle)
  }),
)

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch([query, eventType], () => {
  page.value = 1
})

watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})
</script>

<template>
  <section class="card min-w-0 overflow-hidden">
    <div class="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Centralized history</h2>
        <p class="text-sm text-slate-500">Append-only events for ingestion, login, print validation, votes, and final decisions.</p>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row">
        <label class="block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Event type
          <select v-model="eventType" class="field mt-1 min-w-56">
            <option value="all">All events</option>
            <option v-for="type in eventTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </label>
        <label class="relative block text-xs font-semibold uppercase tracking-wide text-slate-400">
          File ID
          <Search class="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-400" />
          <input v-model="query" type="search" class="field mt-1 min-w-64 pl-9" placeholder="File ID / SP Hash" />
        </label>
      </div>
    </div>

    <div class="overflow-x-auto">
        <table class="w-full min-w-[980px] text-left text-[13px]">
          <thead class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-3 py-3 font-semibold">Log ID</th>
              <th class="px-3 py-3 font-semibold">Timestamp</th>
              <th class="px-3 py-3 font-semibold">File ID / SP Hash</th>
              <th class="px-3 py-3 font-semibold">User ID</th>
              <th class="px-3 py-3 font-semibold">Event Type</th>
              <th class="px-3 py-3 font-semibold">Print Count</th>
              <th class="px-3 py-3 font-semibold">Approver Step</th>
              <th class="sticky right-0 bg-slate-50 px-3 py-3 font-semibold shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in paged" :key="row.id" class="group border-t border-slate-100 align-top hover:bg-slate-50/80">
              <td class="px-3 py-3 font-semibold text-slate-700">{{ row.id }}</td>
              <td class="whitespace-nowrap px-3 py-3 text-slate-600">{{ formatTimestamp(row.timestamp) }}</td>
              <td class="px-3 py-3">
                <p class="font-medium">{{ row.fileId }}</p>
                <p class="font-mono text-[11px] text-slate-400">{{ shortHash(row.spHash) }}</p>
              </td>
              <td class="px-3 py-3">
                <p class="font-medium">{{ row.userId }}</p>
                <p class="text-xs text-slate-500">{{ row.userName }}</p>
              </td>
              <td class="px-3 py-3">
                <p class="font-medium text-slate-800">{{ row.eventType }}</p>
                <p class="mt-1 max-w-xs text-xs leading-5 text-slate-500">{{ row.detail }}</p>
              </td>
              <td class="px-3 py-3 tabular-nums">{{ row.printCount }}</td>
              <td class="px-3 py-3 text-slate-600">{{ row.approverStep }}</td>
              <td class="sticky right-0 bg-white px-3 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)] group-hover:bg-slate-50">
                <StatusPill :label="row.status" :tone="auditStatusTone(row.status)" />
              </td>
            </tr>
          <tr v-if="!paged.length">
            <td colspan="8" class="px-4 py-16 text-center text-slate-500">No audit records match this search.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <span>{{ filtered.length }} records</span>
      <div class="flex gap-2">
        <button type="button" class="btn btn-ghost px-3 py-1.5" :disabled="page === 1" @click="page -= 1">Previous</button>
        <span class="grid place-items-center px-2">{{ page }} / {{ pageCount }}</span>
        <button type="button" class="btn btn-ghost px-3 py-1.5" :disabled="page === pageCount" @click="page += 1">Next</button>
      </div>
    </div>
  </section>
</template>
