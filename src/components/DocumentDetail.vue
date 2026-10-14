<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { ArrowLeft, Copy, Printer, ShieldAlert, ZoomIn, ZoomOut } from '@lucide/vue'
import SerialApprovalMatrix from './SerialApprovalMatrix.vue'
import StatusPill from './StatusPill.vue'
import { approvalStatus, documentStatus, formatIdr, formatTimestamp, shortHash } from '../data/mockData'
import { usePortal } from '../composables/usePortal'

const portal = usePortal()
const zoom = ref(100)
const page = ref(1)
const justification = ref('')
const formError = ref('')

const file = computed(() => portal.selectedDocument)
const modalFile = computed(() => portal.documents.find((item) => item.id === portal.duplicateModalDocId) || null)
const latestPrint = computed(() => file.value?.prints[0] || null)
const hashBits = computed(() => {
  const hash = file.value?.spHash || ''
  const bits = []
  for (let index = 0; index < hash.length && bits.length < 64; index += 1) {
    const value = Number.parseInt(hash[index], 16)
    bits.push(Boolean(value & 8), Boolean(value & 4), Boolean(value & 2), Boolean(value & 1))
  }
  return bits.slice(0, 64)
})

const showApprovedReprint = computed(() => approvalStatus(file.value).label === 'Approved')

const printState = computed(() => {
  const current = file.value
  if (!current) return null
  if (portal.canPrintDocument(current)) {
    return {
      tone: 'border-emerald-200 bg-emerald-50',
      title: 'First print is open',
      body: 'Print Document is eligible while the print count is 0. Print Approved Reprint stays locked until the serial chain is Approved.',
    }
  }
  if (portal.canPrintApprovedReprint(current)) {
    return {
      tone: 'border-emerald-200 bg-emerald-50',
      title: 'Reprint permission unlocked',
      body: 'Serial approval is complete with status Approved. Print Approved Reprint sends that one granted copy.',
    }
  }
  if (current.status === 'approval_required') {
    return {
      tone: 'border-amber-200 bg-amber-50',
      title: 'Print locked during approval',
      body: 'A reprint request is moving through the serial matrix. Another print stays blocked.',
    }
  }
  if (current.status === 'rejected') {
    return {
      tone: 'border-rose-200 bg-rose-50',
      title: 'Print denied',
      body: 'An approver rejected the reprint. Printing stays locked until a new request is approved by the full chain.',
    }
  }
  if (showApprovedReprint.value) {
    return {
      tone: 'border-rose-200 bg-rose-50',
      title: 'Approved reprint already used',
      body: 'The granted copy was already printed. Another copy stays blocked until a new request is fully approved.',
    }
  }
  return {
    tone: 'border-rose-200 bg-rose-50',
    title: 'Subsequent print will be blocked',
    body: 'This file already has a print record. Choosing Print Document opens the duplicate interception.',
  }
})

const showReprintForm = computed(() => {
  const current = modalFile.value
  if (!current) return false
  const request = current.reprintRequest
  if (!request) return true
  if (request.status === 'pending') return false
  if (request.status === 'approved' && current.reprintUnlocked) return false
  return true
})

watch(
  () => portal.duplicateModalDocId,
  (id) => {
    document.body.style.overflow = id ? 'hidden' : ''
    justification.value = ''
    formError.value = ''
  },
)

watch(
  () => portal.selectedId,
  () => {
    portal.duplicateModalDocId = null
    zoom.value = 100
    page.value = 1
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
})

async function copyHash() {
  try {
    await navigator.clipboard.writeText(file.value.spHash)
    portal.pushToast('SP hash copied.', 'info')
  } catch {
    portal.pushToast('Could not copy the hash from this browser.', 'warning')
  }
}

async function submitReprint() {
  if (!justification.value.trim()) {
    formError.value = 'Enter a justification before requesting a reprint.'
    return
  }
  const accepted = portal.submitReprint(modalFile.value.id, justification.value)
  if (!accepted) return
  await nextTick()
  document.getElementById('print-matrix')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function closeModal() {
  portal.duplicateModalDocId = null
}
</script>

<template>
  <div v-if="!file" class="card px-6 py-16 text-center">
    <h2 class="text-lg font-bold text-slate-900">Document not found</h2>
    <button type="button" class="btn btn-dark mt-4" @click="portal.go('inbox')">Back to Inbox</button>
  </div>
  <div v-else class="space-y-4">
    <button type="button" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900" @click="portal.go('inbox')">
      <ArrowLeft class="h-4 w-4" />
      Back to Inbox
    </button>

    <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
      <section class="card overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 text-white">
          <div class="flex items-center gap-3 text-sm">
            <span class="rounded-lg bg-white/10 px-2.5 py-1 font-semibold">{{ page }} / 1</span>
            <span class="text-slate-300">{{ zoom }}%</span>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="grid h-9 w-9 place-items-center rounded-lg bg-white/10 hover:bg-white/15" aria-label="Zoom out" @click="zoom = Math.max(80, zoom - 10)">
              <ZoomOut class="h-4 w-4" />
            </button>
            <button type="button" class="grid h-9 w-9 place-items-center rounded-lg bg-white/10 hover:bg-white/15" aria-label="Zoom in" @click="zoom = Math.min(140, zoom + 10)">
              <ZoomIn class="h-4 w-4" />
            </button>
          </div>
        </div>
        <div class="max-h-[760px] overflow-auto bg-slate-800/95 p-6">
            <article
            class="print-sheet mx-auto w-full bg-white px-8 py-7 text-slate-800 shadow-2xl"
            :style="{ maxWidth: `${Math.round(520 * (zoom / 100))}px` }"
          >
            <header class="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div class="flex items-center gap-3">
                <div class="grid h-12 w-12 place-items-center rounded-lg bg-rose-700 text-sm font-extrabold text-white">SP</div>
                <div>
                  <p class="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Signature Portal</p>
                  <p class="text-sm text-slate-500">Controlled payment document</p>
                </div>
              </div>
              <div>
                <div class="grid grid-cols-8 gap-px bg-slate-300 p-px">
                  <span v-for="(on, index) in hashBits" :key="index" class="h-1.5 w-1.5" :class="on ? 'bg-slate-900' : 'bg-white'" />
                </div>
                <p class="mt-1 text-right text-[10px] uppercase tracking-wide text-slate-400">SP hash</p>
              </div>
            </header>

            <h2 class="mt-6 text-center font-serif text-2xl font-bold tracking-wide text-slate-900">SURAT PERINTAH BAYAR</h2>
            <p class="mt-1 text-center text-xs uppercase tracking-[0.22em] text-slate-400">Payment order</p>

            <dl class="mt-6 space-y-3 text-sm">
              <div class="flex justify-between gap-4 border-b border-dashed border-slate-200 py-1">
                <dt class="text-slate-500">Nomor</dt>
                <dd class="font-semibold">{{ file.id }}</dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-dashed border-slate-200 py-1">
                <dt class="text-slate-500">Tanggal</dt>
                <dd>{{ formatTimestamp(file.receivedAt) }}</dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-dashed border-slate-200 py-1">
                <dt class="text-slate-500">Kepada</dt>
                <dd class="text-right font-semibold">{{ file.vendor }}</dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-dashed border-slate-200 py-1">
                <dt class="text-slate-500">Invoice</dt>
                <dd>{{ file.invoiceNo }}</dd>
              </div>
            </dl>

            <div class="mt-5 rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs uppercase tracking-wide text-slate-400">Jumlah</p>
              <p class="font-serif text-2xl font-bold text-slate-900">{{ formatIdr(file.amount) }}</p>
              <p class="mt-1 text-sm italic text-slate-600">{{ file.amountWords }}</p>
            </div>

            <dl class="mt-5 space-y-2 text-sm">
              <div class="flex justify-between gap-4"><dt class="text-slate-500">Mata uang</dt><dd>{{ file.currency }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">Jenis pembayaran</dt><dd>{{ file.paymentType }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">Rekening</dt><dd class="text-right">{{ file.bankAccount }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">Keperluan</dt><dd class="text-right">{{ file.purpose }}</dd></div>
            </dl>

            <div class="mt-6 space-y-2" aria-hidden="true">
              <div class="h-2.5 w-full rounded-full bg-slate-200" />
              <div class="h-2.5 w-11/12 rounded-full bg-slate-200" />
              <div class="h-2.5 w-4/5 rounded-full bg-slate-100" />
            </div>

            <footer class="mt-8 flex items-end justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
              <p>Print count {{ file.printCount }} · {{ file.costCenter }}</p>
              <p class="max-w-[180px] text-right">Invalid without an audit record in Signature Portal.</p>
            </footer>
          </article>
        </div>
      </section>

      <div class="space-y-4">
        <section class="card p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Document metadata</p>
              <h2 class="mt-1 text-xl font-bold text-slate-900">{{ file.id }}</h2>
              <p class="mt-1 font-mono text-xs text-slate-400">{{ shortHash(file.spHash) }}</p>
            </div>
            <StatusPill :label="documentStatus(file).label" :tone="documentStatus(file).tone" />
          </div>
          <button type="button" class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700" @click="copyHash">
            <Copy class="h-3.5 w-3.5" />
            Copy full SP hash
          </button>
          <dl class="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><dt class="text-slate-400">Upload date</dt><dd class="font-semibold">{{ formatTimestamp(file.receivedAt) }}</dd></div>
            <div><dt class="text-slate-400">Source</dt><dd class="font-semibold">{{ file.source }}</dd></div>
            <div><dt class="text-slate-400">Vendor</dt><dd class="font-semibold">{{ file.vendor }}</dd></div>
            <div><dt class="text-slate-400">Currency</dt><dd class="font-semibold">{{ file.currency }}</dd></div>
            <div class="col-span-2"><dt class="text-slate-400">Amount</dt><dd class="text-lg font-bold">{{ formatIdr(file.amount) }}</dd></div>
            <div><dt class="text-slate-400">Print count</dt><dd class="font-semibold tabular-nums">{{ file.printCount }}</dd></div>
            <div><dt class="text-slate-400">Cost center</dt><dd class="font-semibold">{{ file.costCenter }}</dd></div>
          </dl>
        </section>

        <section class="rounded-2xl border p-5" :class="printState.tone">
          <div class="flex items-start gap-3">
            <ShieldAlert class="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 class="font-bold text-slate-900">{{ printState.title }}</h3>
              <p class="mt-1 text-sm leading-6 text-slate-700">{{ printState.body }}</p>
            </div>
          </div>
          <div v-if="latestPrint" class="mt-4 rounded-xl bg-white/80 p-3 text-sm">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Latest print</p>
            <p class="mt-1 font-semibold">{{ latestPrint.printedBy }} · {{ latestPrint.printerId }}</p>
            <p class="text-slate-500">{{ formatTimestamp(latestPrint.timestamp) }} · {{ latestPrint.reason }}</p>
          </div>
          <div class="mt-4 grid gap-2">
            <button
              v-if="!showApprovedReprint"
              type="button"
              class="btn btn-dark w-full"
              data-testid="print-document"
              @click="portal.attemptPrint(file.id, 'document')"
            >
              <Printer class="h-4 w-4" />
              Print Document
            </button>
            <button
              v-else
              type="button"
              class="btn btn-primary w-full"
              data-testid="print-approved-reprint"
              @click="portal.attemptPrint(file.id, 'reprint')"
            >
              <Printer class="h-4 w-4" />
              Print Approved Reprint
            </button>
          </div>
          <p v-if="portal.roleId !== 'requester'" class="mt-2 text-xs text-slate-600">
            Printing and reprint requests are available to the Treasury requester.
          </p>
        </section>

        <SerialApprovalMatrix :document="file" />
      </div>
    </div>

    <Teleport to="body">
      <div v-if="modalFile" class="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4" @click.self="closeModal">
        <div class="max-h-[90vh] w-full max-w-xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="duplicate-title">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">Duplicate alert</p>
              <h3 id="duplicate-title" class="mt-1 text-xl font-bold text-slate-900">{{ modalFile.id }}</h3>
            </div>
            <StatusPill label="Printed" tone="rose" />
          </div>

          <div class="mt-4 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">
            <ShieldAlert class="mt-0.5 h-5 w-5 shrink-0" />
            <p>Document has already been printed. Subsequent printing requires formal approval.</p>
          </div>

          <div v-if="modalFile.prints[0]" class="mt-4 rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Previous print</p>
            <dl class="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><dt class="text-slate-400">Printed by</dt><dd class="font-semibold">{{ modalFile.prints[0].printedBy }}</dd></div>
              <div><dt class="text-slate-400">Timestamp</dt><dd class="font-semibold">{{ formatTimestamp(modalFile.prints[0].timestamp) }}</dd></div>
              <div><dt class="text-slate-400">Printer ID</dt><dd class="font-semibold">{{ modalFile.prints[0].printerId }}</dd></div>
              <div><dt class="text-slate-400">Reason</dt><dd class="font-semibold">{{ modalFile.prints[0].reason }}</dd></div>
            </dl>
          </div>

          <div v-if="modalFile.reprintRequest?.status === 'rejected'" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            The last request was rejected. Submit a new justification to open another serial chain.
          </div>
          <div v-else-if="modalFile.reprintRequest?.consumed" class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            The previous approved reprint was already used. A new request is required.
          </div>

          <div v-if="modalFile.reprintRequest?.status === 'approved' && modalFile.reprintUnlocked" class="mt-4">
            <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
              Serial approval is complete. Use Print Approved Reprint to send the unlocked copy.
            </div>
            <div class="mt-4 flex justify-end">
              <button type="button" class="btn btn-dark" @click="closeModal">Close</button>
            </div>
          </div>
          <form v-else-if="showReprintForm" class="mt-4" @submit.prevent="submitReprint">
            <label class="text-sm font-semibold text-slate-900" for="reprint-note">Reprint justification</label>
            <textarea
              id="reprint-note"
              v-model="justification"
              maxlength="500"
              rows="4"
              class="field mt-2"
              placeholder="Why is another controlled print required?"
            />
            <p v-if="formError" class="mt-2 text-sm text-rose-600">{{ formError }}</p>
            <p class="mt-2 text-xs leading-5 text-slate-500">
              The reprint stays blocked until every approver in the chain approves. A single rejection locks printing.
            </p>
            <div class="mt-4 flex justify-end gap-2">
              <button type="button" class="btn btn-ghost" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-amber" data-testid="request-reprint">Request Reprint</button>
            </div>
          </form>
          <div v-else class="mt-4">
            <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              A reprint request is already with {{ modalFile.reprintRequest.steps[modalFile.reprintRequest.currentStep].title }}.
            </div>
            <div class="mt-4 flex justify-end">
              <button type="button" class="btn btn-dark" @click="closeModal">View approval progress</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
