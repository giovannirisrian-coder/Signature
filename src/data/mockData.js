export const PRINTER_ID = 'Treasury-Printer-01'

export const roles = [
  {
    id: 'requester',
    label: 'Requester / Treasury User',
    loginLabel: 'Requester User',
    loginGroup: 'Treasury / Standard User',
    name: 'Reza Hidayat',
    title: 'Treasury Officer',
    email: 'reza.hidayat@signature.portal',
    password: 'Demo#Try014',
    initials: 'RH',
    userId: 'USR-TRY-014',
    permissions: 'Prints a file once and submits reprint requests when the gate blocks a second copy.',
  },
  {
    id: 'approver1',
    label: 'Approver 1 (Team Lead)',
    loginLabel: 'Approver 1',
    loginGroup: 'Team Lead',
    name: 'Sari Wulandari',
    title: 'Team Lead',
    email: 'sari.wulandari@signature.portal',
    password: 'Demo#Tld006',
    initials: 'SW',
    userId: 'USR-TLD-006',
    permissions: 'Decides serial step 1. A rejection stops the chain and keeps printing locked.',
  },
  {
    id: 'approver2',
    label: 'Approver 2 (Finance Manager)',
    loginLabel: 'Approver 2',
    loginGroup: 'Finance Manager',
    name: 'Budi Santoso',
    title: 'Finance Manager',
    email: 'budi.santoso@signature.portal',
    password: 'Demo#Fin003',
    initials: 'BS',
    userId: 'USR-FIN-003',
    permissions: 'Decides the final serial step after Approver 1. Approval unlocks one reprint.',
  },
  {
    id: 'audit',
    label: 'Audit / Admin',
    loginLabel: 'Audit Admin',
    loginGroup: 'System Auditor',
    name: 'Maya Kusuma',
    title: 'System Auditor',
    email: 'maya.kusuma@signature.portal',
    password: 'Demo#Aud001',
    initials: 'MK',
    userId: 'USR-AUD-001',
    permissions: 'Reviews documents, print history, and the append-only audit log. Decisions stay with approvers.',
  },
]

export const eventTypes = [
  'Cloud Ingestion',
  'Login',
  'Print Validation Check',
  'Direct Print Execution',
  'PRINT_EXECUTED',
  'Blocked Print Attempt',
  'Reprint Request Submission',
  'Serial Approver Vote',
  'Final Decision',
]

const baseSteps = () => [
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
]

function hashFor(id) {
  let hash = 2166136261
  for (const char of id) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  const parts = []
  let value = hash >>> 0
  for (let index = 0; index < 5; index += 1) {
    value = Math.imul(value ^ (value >>> 13), 0x5bd1e995) >>> 0
    parts.push(value.toString(16).padStart(8, '0'))
  }
  return parts.join('').slice(0, 40)
}

function request(config) {
  const steps = baseSteps()
  config.stepUpdates?.forEach((update, index) => Object.assign(steps[index], update))
  return {
    justification: config.justification,
    requestedBy: config.requestedBy,
    requestedById: config.requestedById,
    requestedAt: config.requestedAt,
    blockedAt: config.blockedAt,
    status: config.status,
    currentStep: config.currentStep,
    consumed: config.consumed ?? false,
    steps,
  }
}

function doc(partial) {
  return {
    documentName: 'Surat Perintah Bayar',
    source: 'RPA → Cloud Storage',
    currency: 'IDR',
    paymentType: 'Transfer',
    costCenter: 'GCS / Treasury',
    reprintUnlocked: false,
    prints: [],
    reprintRequest: null,
    ...partial,
    spHash: hashFor(partial.id),
  }
}

export const documents = [
  doc({
    id: 'SPB-2026-00125',
    uploadDate: '2026-10-08',
    receivedAt: '2026-10-08 09:15:22',
    vendor: 'PT ABC',
    amount: 250000000,
    amountWords: 'Dua ratus lima puluh juta rupiah',
    printCount: 0,
    status: 'not_printed',
    purpose: 'Pembayaran operasional',
    bankAccount: 'Bank Central Asia · 123-456-7890',
    invoiceNo: 'INV-2026-4418',
  }),
  doc({
    id: 'SPB-2026-00124',
    uploadDate: '2026-10-08',
    receivedAt: '2026-10-08 09:08:04',
    vendor: 'PT XYZ',
    amount: 175000000,
    amountWords: 'Seratus tujuh puluh lima juta rupiah',
    printCount: 0,
    status: 'not_printed',
    purpose: 'Pembayaran vendor',
    bankAccount: 'Bank Mandiri · 880-221-0091',
    invoiceNo: 'INV-2026-4412',
  }),
  doc({
    id: 'SPB-2026-00123',
    uploadDate: '2026-10-07',
    receivedAt: '2026-10-07 08:42:16',
    vendor: 'PT DEF',
    amount: 98000000,
    amountWords: 'Sembilan puluh delapan juta rupiah',
    printCount: 1,
    status: 'printed',
    purpose: 'Jasa profesional',
    bankAccount: 'Bank Negara Indonesia · 009-182-3344',
    invoiceNo: 'INV-2026-4388',
    prints: [
      {
        printedBy: 'Reza Hidayat',
        userId: 'USR-TRY-014',
        timestamp: '2026-10-07 15:10:22',
        printerId: PRINTER_ID,
        reason: 'First authorized print',
        copies: 1,
      },
    ],
  }),
  doc({
    id: 'SPB-2026-00122',
    uploadDate: '2026-10-07',
    receivedAt: '2026-10-07 08:36:51',
    vendor: 'PT GHI',
    amount: 320000000,
    amountWords: 'Tiga ratus dua puluh juta rupiah',
    printCount: 1,
    status: 'printed',
    purpose: 'Pembelian material',
    bankAccount: 'Bank Rakyat Indonesia · 552-019-7781',
    invoiceNo: 'INV-2026-4381',
    prints: [
      {
        printedBy: 'Reza Hidayat',
        userId: 'USR-TRY-014',
        timestamp: '2026-10-07 16:42:03',
        printerId: PRINTER_ID,
        reason: 'First authorized print',
        copies: 1,
      },
    ],
  }),
  doc({
    id: 'SPB-2026-00121',
    uploadDate: '2026-10-06',
    receivedAt: '2026-10-06 10:24:18',
    vendor: 'PT JKL',
    amount: 110000000,
    amountWords: 'Seratus sepuluh juta rupiah',
    printCount: 0,
    status: 'not_printed',
    purpose: 'Sewa peralatan',
    bankAccount: 'Bank Central Asia · 771-220-1184',
    invoiceNo: 'INV-2026-4360',
  }),
  doc({
    id: 'SPB-2026-00120',
    uploadDate: '2026-10-06',
    receivedAt: '2026-10-06 08:12:40',
    vendor: 'PT MNO',
    amount: 450000000,
    amountWords: 'Empat ratus lima puluh juta rupiah',
    printCount: 1,
    status: 'approval_required',
    purpose: 'Settlement invoice',
    bankAccount: 'Bank Mandiri · 610-448-2200',
    invoiceNo: 'INV-2026-4352',
    prints: [
      {
        printedBy: 'Reza Hidayat',
        userId: 'USR-TRY-014',
        timestamp: '2026-10-06 13:00:12',
        printerId: PRINTER_ID,
        reason: 'First authorized print',
        copies: 1,
      },
    ],
    reprintRequest: request({
      justification:
        'The paying bank retained the first controlled copy. Treasury needs one additional print for the vendor file.',
      requestedBy: 'Reza Hidayat',
      requestedById: 'USR-TRY-014',
      requestedAt: '2026-10-06 13:24:40',
      blockedAt: '2026-10-06 13:22:05',
      status: 'pending',
      currentStep: 0,
    }),
  }),
  doc({
    id: 'SPB-2026-00119',
    uploadDate: '2026-10-05',
    receivedAt: '2026-10-05 08:20:11',
    vendor: 'PT PQR',
    amount: 210000000,
    amountWords: 'Dua ratus sepuluh juta rupiah',
    printCount: 1,
    status: 'approval_required',
    purpose: 'Pembayaran operasional',
    bankAccount: 'Bank Central Asia · 448-190-6621',
    invoiceNo: 'INV-2026-4294',
    prints: [
      {
        printedBy: 'Reza Hidayat',
        userId: 'USR-TRY-014',
        timestamp: '2026-10-05 10:16:44',
        printerId: PRINTER_ID,
        reason: 'First authorized print',
        copies: 1,
      },
    ],
    reprintRequest: request({
      justification:
        'The original print was attached to the bank instruction and cannot be retrieved. A second controlled copy is required for filing.',
      requestedBy: 'Reza Hidayat',
      requestedById: 'USR-TRY-014',
      requestedAt: '2026-10-05 14:40:10',
      blockedAt: '2026-10-05 14:38:02',
      status: 'pending',
      currentStep: 1,
      stepUpdates: [
        {
          status: 'approved',
          comment: 'Justification matches the bank retention note. Forwarding to finance for the final decision.',
          decidedAt: '2026-10-05 15:12:33',
          decidedBy: 'Sari Wulandari',
          decidedById: 'USR-TLD-006',
        },
      ],
    }),
  }),
  doc({
    id: 'SPB-2026-00118',
    uploadDate: '2026-10-05',
    receivedAt: '2026-10-05 08:05:27',
    vendor: 'PT STU',
    amount: 88000000,
    amountWords: 'Delapan puluh delapan juta rupiah',
    printCount: 1,
    status: 'approved',
    reprintUnlocked: true,
    purpose: 'Jasa profesional',
    bankAccount: 'Bank Negara Indonesia · 220-118-9044',
    invoiceNo: 'INV-2026-4288',
    prints: [
      {
        printedBy: 'Reza Hidayat',
        userId: 'USR-TRY-014',
        timestamp: '2026-10-05 11:12:09',
        printerId: PRINTER_ID,
        reason: 'First authorized print',
        copies: 1,
      },
    ],
    reprintRequest: request({
      justification: 'First copy is held by the paying bank. Please unlock one reprint for the treasury archive.',
      requestedBy: 'Reza Hidayat',
      requestedById: 'USR-TRY-014',
      requestedAt: '2026-10-05 11:33:18',
      blockedAt: '2026-10-05 11:30:41',
      status: 'approved',
      currentStep: 1,
      stepUpdates: [
        {
          status: 'approved',
          comment: 'Duplicate is justified. The first print is held by the paying bank.',
          decidedAt: '2026-10-05 13:20:44',
          decidedBy: 'Sari Wulandari',
          decidedById: 'USR-TLD-006',
        },
        {
          status: 'approved',
          comment: 'Approved for a single reprint. Treasury must use the controlled printer.',
          decidedAt: '2026-10-05 15:48:02',
          decidedBy: 'Budi Santoso',
          decidedById: 'USR-FIN-003',
        },
      ],
    }),
  }),
  doc({
    id: 'SPB-2026-00117',
    uploadDate: '2026-10-04',
    receivedAt: '2026-10-04 08:40:09',
    vendor: 'PT VWX',
    amount: 540000000,
    amountWords: 'Lima ratus empat puluh juta rupiah',
    printCount: 1,
    status: 'rejected',
    purpose: 'Pembelian material',
    bankAccount: 'Bank Rakyat Indonesia · 901-334-2288',
    invoiceNo: 'INV-2026-4210',
    prints: [
      {
        printedBy: 'Reza Hidayat',
        userId: 'USR-TRY-014',
        timestamp: '2026-10-04 15:05:33',
        printerId: PRINTER_ID,
        reason: 'First authorized print',
        copies: 1,
      },
    ],
    reprintRequest: request({
      justification: 'Requesting an extra copy for the project site. The first print is still in the treasury folder.',
      requestedBy: 'Reza Hidayat',
      requestedById: 'USR-TRY-014',
      requestedAt: '2026-10-04 15:24:44',
      blockedAt: '2026-10-04 15:22:10',
      status: 'rejected',
      currentStep: 1,
      stepUpdates: [
        {
          status: 'approved',
          comment: 'Operational need is plausible. Finance should confirm that the first copy is unavailable.',
          decidedAt: '2026-10-04 16:10:05',
          decidedBy: 'Sari Wulandari',
          decidedById: 'USR-TLD-006',
        },
        {
          status: 'rejected',
          comment: 'The first print is still in the treasury folder. A second copy is not justified.',
          decidedAt: '2026-10-04 17:02:51',
          decidedBy: 'Budi Santoso',
          decidedById: 'USR-FIN-003',
        },
      ],
    }),
  }),
  doc({
    id: 'SPB-2026-00116',
    uploadDate: '2026-10-04',
    receivedAt: '2026-10-04 08:10:33',
    vendor: 'PT YZA',
    amount: 76000000,
    amountWords: 'Tujuh puluh enam juta rupiah',
    printCount: 2,
    status: 'printed',
    purpose: 'Sewa peralatan',
    bankAccount: 'Bank Central Asia · 318-667-1204',
    invoiceNo: 'INV-2026-4202',
    prints: [
      {
        printedBy: 'Reza Hidayat',
        userId: 'USR-TRY-014',
        timestamp: '2026-10-04 14:05:47',
        printerId: PRINTER_ID,
        reason: 'Approved reprint execution',
        copies: 1,
      },
      {
        printedBy: 'Reza Hidayat',
        userId: 'USR-TRY-014',
        timestamp: '2026-10-04 09:20:18',
        printerId: PRINTER_ID,
        reason: 'First authorized print',
        copies: 1,
      },
    ],
    reprintRequest: request({
      justification: 'Bank counter kept the first copy. Archive requires the approved reprint.',
      requestedBy: 'Reza Hidayat',
      requestedById: 'USR-TRY-014',
      requestedAt: '2026-10-04 11:06:15',
      blockedAt: '2026-10-04 11:02:40',
      status: 'approved',
      currentStep: 1,
      consumed: true,
      stepUpdates: [
        {
          status: 'approved',
          comment: 'Bank retention confirmed with the counter note.',
          decidedAt: '2026-10-04 11:40:22',
          decidedBy: 'Sari Wulandari',
          decidedById: 'USR-TLD-006',
        },
        {
          status: 'approved',
          comment: 'One reprint granted. The gate closes again after execution.',
          decidedAt: '2026-10-04 13:15:09',
          decidedBy: 'Budi Santoso',
          decidedById: 'USR-FIN-003',
        },
      ],
    }),
  }),
  doc({
    id: 'SPB-2026-00115',
    uploadDate: '2026-10-03',
    receivedAt: '2026-10-03 11:18:45',
    vendor: 'CV Maju Jaya',
    amount: 42000000,
    amountWords: 'Empat puluh dua juta rupiah',
    printCount: 0,
    status: 'not_printed',
    purpose: 'Pembayaran vendor',
    bankAccount: 'Bank Mandiri · 145-908-3312',
    invoiceNo: 'INV-2026-4177',
  }),
  doc({
    id: 'SPB-2026-00114',
    uploadDate: '2026-10-02',
    receivedAt: '2026-10-02 09:02:14',
    vendor: 'PT Bina Karya',
    amount: 190000000,
    amountWords: 'Seratus sembilan puluh juta rupiah',
    printCount: 1,
    status: 'printed',
    purpose: 'Pembayaran operasional',
    bankAccount: 'Bank Negara Indonesia · 774-220-1180',
    invoiceNo: 'INV-2026-4104',
    prints: [
      {
        printedBy: 'Reza Hidayat',
        userId: 'USR-TRY-014',
        timestamp: '2026-10-02 10:18:36',
        printerId: PRINTER_ID,
        reason: 'First authorized print',
        copies: 1,
      },
    ],
  }),
].map((item) => ({
  ...item,
  reprintRequest: item.reprintRequest ? { ...item.reprintRequest, id: `RPR-${item.id}` } : null,
}))

function plusSeconds(timestamp, seconds) {
  const [date, time] = timestamp.split(' ')
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes, secs] = time.split(':').map(Number)
  const value = new Date(year, month - 1, day, hours, minutes, secs + seconds)
  const pad = (n) => String(n).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
}

function createInitialAuditLogs(docs) {
  const rows = []
  const push = (row) => {
    rows.push({
      printerId: '—',
      approverStep: '—',
      printCount: '—',
      ...row,
    })
  }

  const logins = [
    ['2026-10-02 07:50:00', 'USR-TRY-014', 'Reza Hidayat', 'Requester / Treasury User'],
    ['2026-10-06 08:20:00', 'USR-FIN-003', 'Budi Santoso', 'Approver 2 (Finance Manager)'],
    ['2026-10-07 08:15:00', 'USR-TLD-006', 'Sari Wulandari', 'Approver 1 (Team Lead)'],
    ['2026-10-08 07:40:12', 'USR-AUD-001', 'Maya Kusuma', 'Audit / Admin'],
    ['2026-10-08 08:02:11', 'USR-TRY-014', 'Reza Hidayat', 'Requester / Treasury User'],
  ]
  logins.forEach(([timestamp, userId, userName, label]) => {
    push({
      timestamp,
      fileId: '—',
      spHash: '—',
      userId,
      userName,
      eventType: 'Login',
      status: 'Recorded',
      detail: `Session started as ${label}.`,
    })
  })

  docs.forEach((file) => {
    push({
      timestamp: file.receivedAt,
      fileId: file.id,
      spHash: file.spHash,
      userId: 'SYS-RPA',
      userName: 'RPA Automation',
      eventType: 'Cloud Ingestion',
      printCount: 0,
      status: 'Recorded',
      detail: 'External system published the SP file. RPA stored it in Cloud Storage and the portal ingested it.',
    })

    const chronologicalPrints = [...file.prints].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    chronologicalPrints.forEach((print, index) => {
      push({
        timestamp: plusSeconds(print.timestamp, -1),
        fileId: file.id,
        spHash: file.spHash,
        userId: print.userId,
        userName: print.printedBy,
        eventType: 'Print Validation Check',
        printCount: index,
        status: 'Passed',
        detail: index === 0 ? 'One-time gate: first print.' : 'Reprint permission was unlocked.',
        printerId: print.printerId,
      })
      push({
        timestamp: print.timestamp,
        fileId: file.id,
        spHash: file.spHash,
        userId: print.userId,
        userName: print.printedBy,
        eventType: 'Direct Print Execution',
        printCount: index + 1,
        status: 'Completed',
        detail: `${print.reason} on ${print.printerId}.`,
        printerId: print.printerId,
      })
    })

    const reprint = file.reprintRequest
    if (!reprint) return

    const countAtBlock = file.prints.filter((print) => print.timestamp <= reprint.blockedAt).length
    push({
      timestamp: reprint.blockedAt,
      fileId: file.id,
      spHash: file.spHash,
      userId: reprint.requestedById,
      userName: reprint.requestedBy,
      eventType: 'Print Validation Check',
      printCount: countAtBlock,
      status: 'Blocked',
      detail: 'One-time gate: subsequent attempt.',
      printerId: PRINTER_ID,
    })
    push({
      timestamp: plusSeconds(reprint.blockedAt, 1),
      fileId: file.id,
      spHash: file.spHash,
      userId: reprint.requestedById,
      userName: reprint.requestedBy,
      eventType: 'Blocked Print Attempt',
      printCount: countAtBlock,
      status: 'Blocked',
      detail: 'Subsequent print intercepted. Formal approval is required.',
      printerId: PRINTER_ID,
    })
    push({
      timestamp: reprint.requestedAt,
      fileId: file.id,
      spHash: file.spHash,
      userId: reprint.requestedById,
      userName: reprint.requestedBy,
      eventType: 'Reprint Request Submission',
      printCount: countAtBlock,
      approverStep: 'Step 1 queued',
      status: 'Submitted',
      detail: reprint.justification,
    })

    reprint.steps.forEach((step, index) => {
      if (step.status !== 'approved' && step.status !== 'rejected') return
      push({
        timestamp: step.decidedAt,
        fileId: file.id,
        spHash: file.spHash,
        userId: step.decidedById,
        userName: step.decidedBy,
        eventType: 'Serial Approver Vote',
        printCount: countAtBlock,
        approverStep: `Step ${index + 1} · ${step.title}`,
        status: step.status === 'approved' ? 'Approved' : 'Rejected',
        detail: step.comment,
      })
    })

    if (reprint.status === 'approved' || reprint.status === 'rejected') {
      const last = [...reprint.steps].reverse().find((step) => step.decidedAt)
      push({
        timestamp: plusSeconds(last.decidedAt, 1),
        fileId: file.id,
        spHash: file.spHash,
        userId: last.decidedById,
        userName: last.decidedBy,
        eventType: 'Final Decision',
        printCount: countAtBlock,
        approverStep: reprint.status === 'approved' ? 'All steps' : `Step ${reprint.currentStep + 1}`,
        status: reprint.status === 'approved' ? 'Granted' : 'Denied',
        detail:
          reprint.status === 'approved'
            ? 'All approvers approved in sequence. One reprint was unlocked.'
            : 'Veto applied. Any single rejection keeps print access locked.',
      })
    }
  })

  return rows
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((row, index) => ({ ...row, id: `AUD-${String(index + 1).padStart(5, '0')}` }))
    .reverse()
}

export const auditLogs = createInitialAuditLogs(documents)

export function formatIdr(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatLongDate(iso) {
  if (!iso || iso === '—') return '—'
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTimestamp(timestamp) {
  if (!timestamp || timestamp === '—') return '—'
  const [date, time] = timestamp.split(' ')
  return `${formatLongDate(date)} ${time}`
}

export function shortHash(hash) {
  if (!hash || hash === '—') return '—'
  return `${hash.slice(0, 10)}…${hash.slice(-4)}`
}

export function documentStatus(file) {
  if (file.status === 'printed') return { label: `Printed (${file.printCount})`, tone: 'emerald' }
  if (file.status === 'not_printed') return { label: 'Not Printed (0)', tone: 'sky' }
  if (file.status === 'approval_required') return { label: 'Approval Required', tone: 'amber' }
  if (file.status === 'approved') return { label: 'Approved', tone: 'emerald' }
  if (file.status === 'rejected') return { label: 'Rejected', tone: 'rose' }
  return { label: file.status, tone: 'slate' }
}

export const approverRoleIds = ['approver1', 'approver2', 'audit']

export function canAccessApprovals(roleId) {
  return approverRoleIds.includes(roleId)
}

export function printStatus(file) {
  const count = file?.printCount || 0
  if (count === 0) return { label: 'Not Printed (0)', tone: 'sky' }
  return { label: `Printed (${count})`, tone: 'emerald' }
}

export function currentPic(file) {
  const request = file?.reprintRequest
  if (!request || request.status !== 'pending') return null
  const step = request.steps[request.currentStep]
  if (!step) return null
  const owner = roles.find((item) => item.id === step.role)
  return { title: step.title, name: owner?.name || '' }
}

export function approvalStatus(file) {
  const request = file?.reprintRequest
  if (!request) return { label: 'N/A', tone: 'slate' }
  if (request.status === 'pending') return { label: 'Pending Approval', tone: 'amber' }
  if (request.status === 'approved' && request.consumed) return { label: 'Reprinted', tone: 'slate' }
  if (request.status === 'approved') return { label: 'Approved', tone: 'emerald' }
  if (request.status === 'rejected') return { label: 'Rejected', tone: 'rose' }
  return { label: 'N/A', tone: 'slate' }
}

export function auditStatusTone(status) {
  const tones = {
    Recorded: 'slate',
    Passed: 'sky',
    Blocked: 'rose',
    Completed: 'emerald',
    Submitted: 'amber',
    Approved: 'emerald',
    Rejected: 'rose',
    Granted: 'emerald',
    Denied: 'rose',
  }
  return tones[status] || 'slate'
}

export function cloneSeed() {
  return {
    documents: structuredClone(documents),
    auditLogs: structuredClone(auditLogs),
  }
}
