import { computed, inject, provide, reactive, ref } from 'vue'
import { PRINTER_ID, canAccessApprovals, cloneSeed, roles } from '../data/mockData'
import router from '../router'

export const PortalKey = Symbol('portal')
const SESSION_KEY = 'signature-portal-role'

function readSessionRole() {
  try {
    const id = sessionStorage.getItem(SESSION_KEY)
    return roles.some((item) => item.id === id) ? id : null
  } catch {
    return null
  }
}

function writeSessionRole(id) {
  try {
    if (id) sessionStorage.setItem(SESSION_KEY, id)
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* Session storage is optional for this mock. */
  }
}

export function canPrintDocument(file) {
  return Boolean(file) && file.printCount === 0
}

export function canPrintApprovedReprint(file) {
  const request = file?.reprintRequest
  if (!file || !request) return false
  if (request.status !== 'approved' || request.consumed) return false
  if (file.status !== 'approved' || !file.reprintUnlocked) return false
  return request.steps.length > 0 && request.steps.every((step) => step.status === 'approved')
}

function nowStamp() {
  const value = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
}

export function providePortal() {
  const seed = cloneSeed()
  const savedRole = readSessionRole()
  const authenticated = ref(Boolean(savedRole))
  const roleId = ref(savedRole || 'requester')
  const view = ref('inbox')
  const selectedId = ref(null)
  const documents = ref(seed.documents)
  const auditLogs = ref(seed.auditLogs)
  const toasts = ref([])
  const duplicateModalDocId = ref(null)
  let toastSeq = 1

  const role = computed(() => roles.find((item) => item.id === roleId.value))
  const selectedDocument = computed(() => documents.value.find((item) => item.id === selectedId.value) || null)
  const kpis = computed(() => ({
    total: documents.value.length,
    unprinted: documents.value.filter((item) => item.printCount === 0).length,
    printed: documents.value.filter((item) => item.printCount >= 1).length,
    pending: documents.value.filter((item) => item.status === 'approval_required').length,
  }))

  function pushToast(message, tone = 'success') {
    const id = toastSeq
    toastSeq += 1
    toasts.value = [...toasts.value, { id, message, tone }].slice(-4)
    setTimeout(() => {
      toasts.value = toasts.value.filter((toast) => toast.id !== id)
    }, 4200)
  }

  function dismissToast(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function nextLogId() {
    const max = auditLogs.value.reduce((highest, row) => {
      const value = Number(String(row.id).replace('AUD-', ''))
      return Number.isFinite(value) ? Math.max(highest, value) : highest
    }, 0)
    return `AUD-${String(max + 1).padStart(5, '0')}`
  }

  function pushAudit(entry) {
    auditLogs.value.unshift({
      id: nextLogId(),
      timestamp: nowStamp(),
      fileId: entry.fileId ?? '—',
      spHash: entry.spHash ?? '—',
      userId: entry.userId || role.value.userId,
      userName: entry.userName || role.value.name,
      eventType: entry.eventType,
      printCount: entry.printCount ?? '—',
      approverStep: entry.approverStep || '—',
      status: entry.status,
      detail: entry.detail || '',
      printerId: entry.printerId || '—',
    })
  }

  function findDocument(fileId) {
    return documents.value.find((item) => item.id === fileId)
  }

  function setRole(id) {
    if (!roles.some((item) => item.id === id) || roleId.value === id) return
    roleId.value = id
    writeSessionRole(id)
    const next = roles.find((item) => item.id === id)
    pushAudit({
      fileId: '—',
      spHash: '—',
      userId: next.userId,
      userName: next.name,
      eventType: 'Login',
      printCount: '—',
      approverStep: '—',
      status: 'Recorded',
      detail: `Session started as ${next.label}.`,
    })
    pushToast(`Signed in as ${next.name} · ${next.label}`, 'info')
  }

  const pathByView = {
    inbox: '/inbox',
    approvals: '/approvals',
    history: '/print-history',
    audit: '/audit-log',
    settings: '/settings',
  }

  function navigate(location) {
    return router.push(location).catch(() => {})
  }

  function syncRoute(to) {
    if (to.name === 'document') {
      selectedId.value = typeof to.params.id === 'string' ? to.params.id : ''
      view.value = 'detail'
      return
    }
    duplicateModalDocId.value = null
    const viewByName = {
      inbox: 'inbox',
      approvals: 'approvals',
      history: 'history',
      audit: 'audit',
      settings: 'settings',
    }
    if (viewByName[to.name]) view.value = viewByName[to.name]
  }

  function login(id) {
    const next = roles.find((item) => item.id === id)
    if (!next) return false
    roleId.value = id
    authenticated.value = true
    selectedId.value = null
    duplicateModalDocId.value = null
    view.value = 'inbox'
    writeSessionRole(id)
    pushAudit({
      fileId: '—',
      spHash: '—',
      userId: next.userId,
      userName: next.name,
      eventType: 'Login',
      printCount: '—',
      approverStep: '—',
      status: 'Recorded',
      detail: `Session started as ${next.label}.`,
    })
    pushToast(`Signed in as ${next.name} · ${next.label}`, 'info')
    navigate('/inbox')
    return true
  }

  function logout() {
    authenticated.value = false
    selectedId.value = null
    duplicateModalDocId.value = null
    view.value = 'inbox'
    writeSessionRole(null)
    navigate('/login')
  }

  function openDocument(id) {
    if (!id || id === '—') return
    navigate({ name: 'document', params: { id } })
  }

  function go(next) {
    if (next === 'approvals' && !canAccessApprovals(roleId.value)) {
      navigate('/inbox')
      return
    }
    const path = pathByView[next]
    if (!path) return
    navigate(path)
  }

  function attemptPrint(fileId, mode = 'document') {
    if (roleId.value !== 'requester') {
      pushToast('Switch to Requester / Treasury User to execute printing.', 'warning')
      return
    }
    const file = findDocument(fileId)
    if (!file) return

    const reprint = mode === 'reprint'
    const allowed = reprint ? canPrintApprovedReprint(file) : canPrintDocument(file)
    pushAudit({
      fileId: file.id,
      spHash: file.spHash,
      eventType: 'Print Validation Check',
      printCount: file.printCount,
      status: allowed ? 'Passed' : 'Blocked',
      detail: reprint
        ? allowed
          ? 'Serial approval is complete with status Approved.'
          : file.reprintRequest?.consumed
            ? 'Reprint gate: the approved copy was already used.'
            : 'Reprint gate: serial approval is not fully Approved.'
        : file.printCount === 0
          ? 'One-time gate: first print.'
          : 'One-time gate: subsequent attempt.',
      printerId: PRINTER_ID,
    })

    if (!allowed) {
      pushAudit({
        fileId: file.id,
        spHash: file.spHash,
        eventType: 'Blocked Print Attempt',
        printCount: file.printCount,
        status: 'Blocked',
        detail: reprint
          ? file.reprintRequest?.consumed
            ? 'Approved reprint intercepted. The granted copy was already used.'
            : 'Approved reprint intercepted. The serial chain is not fully Approved.'
          : 'Subsequent print intercepted. Formal approval is required.',
        printerId: PRINTER_ID,
      })
      if (file.printCount > 0) {
        duplicateModalDocId.value = file.id
        pushToast('Print blocked. This document has already been printed.', 'danger')
      } else {
        pushToast('Print Approved Reprint stays locked until the serial chain is Approved.', 'warning')
      }
      return
    }

    window.print()

    const reason = reprint ? 'Approved reprint execution' : 'First authorized print'
    file.printCount += 1
    file.reprintUnlocked = false
    file.status = 'printed'
    file.prints.unshift({
      printedBy: role.value.name,
      userId: role.value.userId,
      timestamp: nowStamp(),
      printerId: PRINTER_ID,
      reason,
      copies: 1,
    })
    if (file.reprintRequest?.status === 'approved') file.reprintRequest.consumed = true

    pushAudit({
      fileId: file.id,
      spHash: file.spHash,
      eventType: 'PRINT_EXECUTED',
      printCount: file.printCount,
      status: 'Completed',
      detail: `${reason} on ${PRINTER_ID}.`,
      printerId: PRINTER_ID,
    })
    duplicateModalDocId.value = null
    pushToast('Document sent to printer successfully', 'success')
  }

  function submitReprint(fileId, justification) {
    if (roleId.value !== 'requester') {
      pushToast('Switch to Requester / Treasury User to request a reprint.', 'warning')
      return false
    }
    const file = findDocument(fileId)
    const note = justification.trim()
    if (!file || !note) {
      pushToast('A justification note is required before submitting a reprint request.', 'warning')
      return false
    }
    if (file.reprintRequest?.status === 'pending') {
      pushToast('A reprint request is already in the approval chain.', 'warning')
      return false
    }
    if (file.reprintUnlocked) {
      pushToast('A reprint is already unlocked. Print the document instead of opening a new request.', 'warning')
      return false
    }

    file.reprintRequest = {
      id: `RPR-${file.id}`,
      justification: note,
      requestedBy: role.value.name,
      requestedById: role.value.userId,
      requestedAt: nowStamp(),
      blockedAt: nowStamp(),
      status: 'pending',
      currentStep: 0,
      consumed: false,
      steps: [
        {
          key: 'approver1',
          role: 'approver1',
          title: 'Approver 1 (Team Lead)',
          status: 'pending',
          comment: '',
          decidedAt: '',
          decidedBy: '',
          decidedById: '',
        },
        {
          key: 'approver2',
          role: 'approver2',
          title: 'Approver 2 (Finance Manager)',
          status: 'pending',
          comment: '',
          decidedAt: '',
          decidedBy: '',
          decidedById: '',
        },
      ],
    }
    file.status = 'approval_required'
    file.reprintUnlocked = false
    pushAudit({
      fileId: file.id,
      spHash: file.spHash,
      eventType: 'Reprint Request Submission',
      printCount: file.printCount,
      approverStep: 'Step 1 queued',
      status: 'Submitted',
      detail: note,
    })
    duplicateModalDocId.value = null
    pushToast('Reprint request submitted. Waiting for Approver 1.', 'success')
    return true
  }

  function decideApproval(fileId, decision, comment) {
    const file = findDocument(fileId)
    const reprint = file?.reprintRequest
    if (!reprint || reprint.status !== 'pending') {
      pushToast('This request is no longer awaiting a decision.', 'warning')
      return false
    }
    const step = reprint.steps[reprint.currentStep]
    if (roleId.value !== step.role) {
      pushToast(`This step belongs to ${step.title}. Switch role to decide.`, 'warning')
      return false
    }
    const note = comment.trim()
    if (!note) {
      pushToast('Add a comment before you approve or reject.', 'warning')
      return false
    }

    step.comment = note
    step.decidedAt = nowStamp()
    step.decidedBy = role.value.name
    step.decidedById = role.value.userId
    step.status = decision === 'approve' ? 'approved' : 'rejected'

    pushAudit({
      fileId: file.id,
      spHash: file.spHash,
      eventType: 'Serial Approver Vote',
      printCount: file.printCount,
      approverStep: `Step ${reprint.currentStep + 1} · ${step.title}`,
      status: decision === 'approve' ? 'Approved' : 'Rejected',
      detail: note,
    })

    if (decision === 'reject') {
      reprint.status = 'rejected'
      file.status = 'rejected'
      file.reprintUnlocked = false
      reprint.steps.forEach((item, index) => {
        if (index > reprint.currentStep) item.status = 'skipped'
      })
      pushAudit({
        fileId: file.id,
        spHash: file.spHash,
        eventType: 'Final Decision',
        printCount: file.printCount,
        approverStep: `Step ${reprint.currentStep + 1}`,
        status: 'Denied',
        detail: 'Veto applied. Any single rejection keeps print access locked.',
      })
      pushToast('Request rejected. Print access remains locked.', 'danger')
      return true
    }

    const isLast = reprint.currentStep === reprint.steps.length - 1
    if (isLast) {
      reprint.status = 'approved'
      file.status = 'approved'
      file.reprintUnlocked = true
      pushAudit({
        fileId: file.id,
        spHash: file.spHash,
        eventType: 'Final Decision',
        printCount: file.printCount,
        approverStep: 'All steps',
        status: 'Granted',
        detail: 'All approvers approved in sequence. One reprint was unlocked.',
      })
      pushToast('All approvers granted the request. One reprint is unlocked.', 'success')
      return true
    }

    reprint.currentStep += 1
    pushToast(`Step approved. Forwarded to ${reprint.steps[reprint.currentStep].title}.`, 'success')
    return true
  }

  function resetDemo() {
    const fresh = cloneSeed()
    documents.value = fresh.documents
    auditLogs.value = fresh.auditLogs
    duplicateModalDocId.value = null
    selectedId.value = null
    view.value = 'inbox'
    navigate('/inbox')
    pushToast('Sample documents and audit history were restored.', 'info')
  }

  const state = reactive({
    authenticated,
    roleId,
    role,
    roles,
    view,
    selectedId,
    selectedDocument,
    documents,
    auditLogs,
    toasts,
    duplicateModalDocId,
    kpis,
    setRole,
    login,
    logout,
    openDocument,
    go,
    syncRoute,
    attemptPrint,
    canPrintDocument,
    canPrintApprovedReprint,
    submitReprint,
    decideApproval,
    pushToast,
    dismissToast,
    resetDemo,
  })

  provide(PortalKey, state)
  return state
}

export function usePortal() {
  const portal = inject(PortalKey)
  if (!portal) throw new Error('Signature Portal state is not available')
  return portal
}
