<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { Check, Search, X } from '@lucide/vue'
import SerialApprovalMatrix from './SerialApprovalMatrix.vue'
import StatusPill from './StatusPill.vue'
import { approvalStatus, currentPic, formatIdr, formatLongDate, formatTimestamp, printStatus, shortHash } from '../data/mockData'
import { usePortal } from '../composables/usePortal'

const portal = usePortal()
const query = ref('')
const page = ref(1)
const pageSize = 6
const modalId = ref(null)
const comment = ref('')
const commentError = ref('')

const tasks = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return portal.documents
    .filter((file) => file.reprintRequest)
    .filter((file) => {
      if (!needle) return true
      return [file.id, file.spHash, file.vendor, file.documentName, file.reprintRequest.requestedBy]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
    .sort((a, b) => {
      const rank = (file) => (file.reprintRequest.status === 'pending' ? 0 : 1)
      return rank(a) - rank(b) || b.reprintRequest.requestedAt.localeCompare(a.reprintRequest.requestedAt)
    })
})

const pageCount = computed(() => Math.max(1, Math.ceil(tasks.value.length / pageSize)))
const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return tasks.value.slice(start, start + pageSize)
})
const rangeLabel = computed(() => {
  if (!tasks.value.length) return 'Showing 0 of 0'
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, tasks.value.length)
  return `Showing ${start}–${end} of ${tasks.value.length}`
})
const modalFile = computed(() => portal.documents.find((file) => file.id === modalId.value) || null)
const activeStep = computed(() => {
  const request = modalFile.value?.reprintRequest
  if (!request) return null
  return request.steps[request.currentStep] || null
})

watch([query], () => {
  page.value = 1
})

watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})

watch(modalId, (id) => {
  document.body.style.overflow = id ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

function openApproval(file) {
  if (file.reprintRequest?.status !== 'pending') return
  comment.value = ''
  modalId.value = file.id
}

function closeModal() {
  modalId.value = null
  comment.value = ''
  commentError.value = ''
}

watch(comment, () => {
  commentError.value = ''
})

function decide(decision) {
  if (!modalFile.value) return
  if (!comment.value.trim()) {
    commentError.value = 'Add a comment before you approve or reject.'
    return
  }
  const accepted = portal.decideApproval(modalFile.value.id, decision, comment.value)
  if (accepted) comment.value = ''
}
</script>

<template>
  <section class="card min-w-0 overflow-hidden">
    <div class="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Reprint approval queue</h2>
        <p class="text-sm text-slate-500">Decide pending reprints here. Document review stays on View &amp; Print.</p>
      </div>
      <label class="relative block text-xs font-semibold uppercase tracking-wide text-slate-400">
        Search
        <Search class="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-400" />
        <input
          v-model="query"
          type="search"
          class="field mt-1 min-w-64 pl-9"
          placeholder="File ID / SP Hash / Vendor"
        />
      </label>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[1040px] text-left text-[13px]">
        <thead class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-3 py-3 font-semibold">File ID / SP Hash</th>
            <th class="px-3 py-3 font-semibold">Document Name</th>
            <th class="px-3 py-3 font-semibold">Source</th>
            <th class="px-3 py-3 font-semibold">Upload Date</th>
            <th class="px-3 py-3 text-right font-semibold">Amount</th>
            <th class="px-3 py-3 font-semibold">Print Status</th>
            <th class="px-3 py-3 font-semibold">Approval Status</th>
              <th class="px-3 py-3 font-semibold">Current PIC</th>
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
              <td class="px-3 py-3">
                <template v-if="currentPic(file)">
                  <p class="font-medium text-slate-800">{{ currentPic(file).name }}</p>
                  <p class="text-xs text-slate-500">{{ currentPic(file).title }}</p>
                </template>
                <StatusPill v-else label="N/A" tone="slate" />
              </td>
            <td class="sticky right-0 bg-white px-3 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)] group-hover:bg-slate-50">
              <button
                v-if="file.reprintRequest.status === 'pending'"
                type="button"
                class="btn btn-dark whitespace-nowrap px-3 py-2 text-xs"
                data-testid="open-approval"
                @click="openApproval(file)"
              >
                Approval
              </button>
              <span v-else class="text-xs font-medium text-slate-400">—</span>
            </td>
          </tr>
          <tr v-if="!paged.length">
            <td colspan="9" class="px-4 py-16 text-center text-slate-500">
              No reprint requests match the current search.
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

  <Teleport to="body">
    <div
      v-if="modalFile"
      class="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4"
      @click.self="closeModal"
    >
      <div
        class="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-title"
        data-testid="approval-modal"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Approval</p>
            <h3 id="approval-title" class="mt-1 text-xl font-bold text-slate-900">{{ modalFile.id }}</h3>
            <p class="mt-1 text-sm text-slate-500">{{ modalFile.documentName }} · {{ modalFile.vendor }}</p>
          </div>
          <button type="button" class="btn btn-ghost px-3 py-2" aria-label="Close approval" @click="closeModal">
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <StatusPill :label="printStatus(modalFile).label" :tone="printStatus(modalFile).tone" />
          <StatusPill :label="approvalStatus(modalFile).label" :tone="approvalStatus(modalFile).tone" />
        </div>

        <dl class="mt-4 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 p-4 text-sm">
          <div>
            <dt class="text-slate-400">Amount</dt>
            <dd class="font-semibold">{{ formatIdr(modalFile.amount) }}</dd>
          </div>
          <div>
            <dt class="text-slate-400">Invoice</dt>
            <dd class="font-semibold">{{ modalFile.invoiceNo }}</dd>
          </div>
          <div>
            <dt class="text-slate-400">Source</dt>
            <dd class="font-semibold">{{ modalFile.source }}</dd>
          </div>
          <div>
            <dt class="text-slate-400">Upload date</dt>
            <dd class="font-semibold">{{ formatTimestamp(modalFile.receivedAt) }}</dd>
          </div>
          <div>
            <dt class="text-slate-400">Purpose</dt>
            <dd class="font-semibold">{{ modalFile.purpose }}</dd>
          </div>
          <div>
            <dt class="text-slate-400">SP hash</dt>
            <dd class="font-mono text-xs font-semibold">{{ shortHash(modalFile.spHash) }}</dd>
          </div>
          <div class="col-span-2">
            <dt class="text-slate-400">Requested by</dt>
            <dd class="font-semibold">
              {{ modalFile.reprintRequest.requestedBy }} · {{ formatTimestamp(modalFile.reprintRequest.requestedAt) }}
            </dd>
          </div>
        </dl>

        <blockquote class="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Reprint justification</p>
          <p class="mt-1">“{{ modalFile.reprintRequest.justification }}”</p>
        </blockquote>

        <div class="mt-4">
          <SerialApprovalMatrix :document="modalFile" plain :show-request="false" :show-waiting="false" />
        </div>

        <p
          v-if="modalFile.reprintRequest.status === 'pending' && activeStep && portal.roleId !== activeStep.role"
          class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"
        >
          Waiting on {{ activeStep.title }}. This step is not assigned to your account.
        </p>
        <div
          v-else-if="modalFile.reprintRequest.status === 'pending'"
          class="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4"
        >
          <label class="text-sm font-semibold text-slate-900" for="approval-comment">Comment</label>
          <textarea
            id="approval-comment"
            v-model="comment"
            maxlength="400"
            rows="3"
            class="field mt-2 bg-white"
            placeholder="Record why this reprint is approved or rejected"
            data-testid="approval-comment"
          />
          <p v-if="commentError" class="mt-2 text-sm text-rose-600" data-testid="approval-comment-error">{{ commentError }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button type="button" class="btn btn-primary" data-testid="approve-request" @click="decide('approve')">
              <Check class="h-4 w-4" />
              Approve
            </button>
            <button type="button" class="btn btn-danger" data-testid="reject-request" @click="decide('reject')">
              <X class="h-4 w-4" />
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
