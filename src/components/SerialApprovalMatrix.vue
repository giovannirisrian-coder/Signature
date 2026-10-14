<script setup>
import { computed } from 'vue'
import { Check, X } from '@lucide/vue'
import StatusPill from './StatusPill.vue'
import { usePortal } from '../composables/usePortal'

const props = defineProps({
  document: { type: Object, required: true },
  showRequest: { type: Boolean, default: true },
  showWaiting: { type: Boolean, default: true },
  plain: { type: Boolean, default: false },
})

const portal = usePortal()

const request = computed(() => props.document.reprintRequest)
const activeStep = computed(() => request.value?.steps[request.value.currentStep] || null)

function stepTone(step, index) {
  if (step.status === 'approved') return 'bg-emerald-600 text-white ring-emerald-600'
  if (step.status === 'rejected') return 'bg-rose-600 text-white ring-rose-600'
  if (request.value.status === 'pending' && index === request.value.currentStep) {
    return 'bg-amber-500 text-white ring-amber-500'
  }
  return 'bg-white text-slate-500 ring-slate-200'
}

function stepLabel(step, index) {
  if (step.status === 'approved') return { label: 'Approved', tone: 'emerald' }
  if (step.status === 'rejected') return { label: 'Rejected', tone: 'rose' }
  if (step.status === 'skipped') return { label: 'Skipped', tone: 'slate' }
  if (request.value.status === 'pending' && index === request.value.currentStep) {
    return { label: 'Current step', tone: 'amber' }
  }
  return { label: 'Waiting', tone: 'slate' }
}

function lineTone(step) {
  if (step.status === 'approved') return 'bg-emerald-300'
  if (step.status === 'rejected') return 'bg-rose-300'
  return 'bg-slate-200'
}
</script>

<template>
  <section v-if="request" id="print-matrix" :class="plain ? '' : 'card p-5'">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Serial approval matrix</p>
        <h3 class="mt-1 text-base font-bold text-slate-900">Approver 1 → Approver 2 (Final)</h3>
      </div>
      <StatusPill
        :label="request.status === 'pending' ? 'In sequence' : request.status === 'approved' ? 'Granted' : 'Denied'"
        :tone="request.status === 'pending' ? 'amber' : request.status === 'approved' ? 'emerald' : 'rose'"
      />
    </div>

    <p class="mt-3 text-sm leading-6 text-slate-600">
      Approvers vote in order. If any one approver rejects, the request is denied and print access stays locked.
      Print permission is unlocked only after every step is approved.
    </p>

    <blockquote v-if="showRequest" class="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
      <span class="font-semibold text-slate-900">{{ request.requestedBy }}</span>
      requested a reprint. “{{ request.justification }}”
    </blockquote>

    <div
      v-if="request.status === 'rejected'"
      class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
    >
      Veto recorded. Print permission stays locked.
    </div>
    <div
      v-else-if="request.status === 'approved' && document.reprintUnlocked"
      class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
    >
      All approvers granted this request. One reprint can be executed.
    </div>
    <div
      v-else-if="request.consumed"
      class="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
    >
      The approved reprint was executed. The one-time gate is closed again.
    </div>

    <ol class="mt-5">
      <li v-for="(step, index) in request.steps" :key="step.key" class="flex gap-4">
        <div class="flex flex-col items-center">
          <div
            class="grid h-9 w-9 place-items-center rounded-full text-sm font-bold ring-2"
            :class="stepTone(step, index)"
          >
            <Check v-if="step.status === 'approved'" class="h-4 w-4" />
            <X v-else-if="step.status === 'rejected'" class="h-4 w-4" />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div v-if="index < request.steps.length - 1" class="my-1 w-px flex-1" :class="lineTone(step)" />
        </div>

        <div class="min-w-0 flex-1 pb-6">
          <div class="flex flex-wrap items-center gap-2">
            <h4 class="font-semibold text-slate-900">{{ step.title }}</h4>
            <span v-if="index === request.steps.length - 1" class="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Approver N
            </span>
            <StatusPill :label="stepLabel(step, index).label" :tone="stepLabel(step, index).tone" />
          </div>
          <p v-if="step.decidedBy" class="mt-1 text-xs text-slate-500">
            {{ step.decidedBy }} · {{ step.decidedAt }}
          </p>
          <p v-if="step.comment" class="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
            {{ step.comment }}
          </p>
          <p v-else-if="step.status === 'skipped'" class="mt-2 text-sm text-slate-500">
            Skipped because an earlier approver rejected the request.
          </p>
        </div>
      </li>
    </ol>

    <p v-if="showWaiting && request.status === 'pending'" class="text-sm text-slate-500">
      <template v-if="portal.roleId === 'audit'">Audit access is read-only. {{ activeStep.title }} records the decision.</template>
      <template v-else-if="portal.roleId === 'requester'">Waiting on {{ activeStep.title }}.</template>
      <template v-else-if="portal.roleId !== activeStep.role">Waiting on {{ activeStep.title }} before this role can vote.</template>
      <template v-else>This step is ready for {{ activeStep.title }}. Decide it from Approval Tasks.</template>
    </p>
  </section>
</template>
