<script setup>
import { ref } from 'vue'
import { Cloud, Printer, ShieldCheck } from '@lucide/vue'
import { PRINTER_ID } from '../data/mockData'
import { usePortal } from '../composables/usePortal'

const portal = usePortal()
const armed = ref(false)
let timer

function armReset() {
  armed.value = true
  clearTimeout(timer)
  timer = setTimeout(() => {
    armed.value = false
  }, 4000)
}

function confirmReset() {
  clearTimeout(timer)
  armed.value = false
  portal.resetDemo()
}

const steps = [
  {
    title: 'Cloud ingestion',
    body: 'An external system publishes the SP file. RPA uploads it to Cloud Storage and the portal ingests it.',
  },
  {
    title: 'One-time print gate',
    body: 'The first print executes directly. Every later attempt is blocked until the serial chain grants one reprint.',
  },
  {
    title: 'Serial approval',
    body: 'Approver 1 votes, then Approver 2. Any rejection denies the request. All approvals unlock one print.',
  },
  {
    title: 'Audit log',
    body: 'Ingestion, login, validation, prints, votes, and the final decision are appended and never edited.',
  },
]
</script>

<template>
  <div class="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
    <section class="card p-6">
      <h2 class="text-lg font-bold text-slate-900">Control policy</h2>
      <ol class="mt-5 space-y-4">
        <li v-for="(step, index) in steps" :key="step.title" class="flex gap-4">
          <div class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {{ index + 1 }}
          </div>
          <div>
            <h3 class="font-semibold text-slate-900">{{ step.title }}</h3>
            <p class="mt-1 text-sm leading-6 text-slate-600">{{ step.body }}</p>
          </div>
        </li>
      </ol>
    </section>

    <div class="space-y-5">
      <section class="card p-5">
        <div class="flex items-center gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Cloud class="h-5 w-5" />
          </div>
          <div>
            <h2 class="font-bold text-slate-900">Cloud Storage sync</h2>
            <p class="text-sm text-emerald-700">Active · sp-files bucket</p>
          </div>
        </div>
        <div class="mt-4 flex items-center gap-3 text-sm text-slate-600">
          <Printer class="h-4 w-4" />
          {{ PRINTER_ID }} · online
        </div>
        <div class="mt-3 flex items-start gap-3 text-sm text-slate-600">
          <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0" />
          <p>{{ portal.role.permissions }}</p>
        </div>
      </section>

      <section class="card p-5">
        <h2 class="font-bold text-slate-900">Sample session</h2>
        <p class="mt-2 text-sm leading-6 text-slate-600">
          Restoring sample data returns the inbox, approval queue, and audit log to their original records.
        </p>
        <button v-if="!armed" type="button" class="btn btn-ghost mt-4" @click="armReset">Restore sample data</button>
        <button v-else type="button" class="btn btn-danger mt-4" @click="confirmReset">Confirm restore</button>
      </section>
    </div>
  </div>
</template>
