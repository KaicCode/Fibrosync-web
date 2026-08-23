import type {
  AdminReport,
  AdminReportDocument,
  AdminReportHistoryItem,
  AdminSymptomRecord,
  AdminUser,
} from '@/types/admin'
import {
  resolveAccountStatusLabel,
  resolveRoleLabel,
} from '@/lib/user-role'

const PDF_PAGE_WIDTH = 612
const PDF_PAGE_HEIGHT = 792
const PDF_MARGIN_LEFT = 48
const PDF_MARGIN_TOP = 748
const PDF_MARGIN_BOTTOM = 52
const PDF_LINE_GAP = 6
const STORAGE_DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

type GeneratedReportArtifacts = Pick<
  AdminReportHistoryItem,
  'name' | 'fileName' | 'document' | 'payload'
>

type PdfPrintableLine = {
  text: string
  size: number
  bold?: boolean
}

type RecentVolumePoint = {
  date: string
  total: number
}

function normalizeAscii(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, '')
}

function escapePdfText(value: string): string {
  return normalizeAscii(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function splitTextIntoLines(value: string, maxChars = 88): string[] {
  const sanitized = normalizeAscii(value).trim()

  if (!sanitized) {
    return ['']
  }

  const words = sanitized.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (nextLine.length <= maxChars) {
      currentLine = nextLine
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
      currentLine = word
      continue
    }

    lines.push(word.slice(0, maxChars))
    currentLine = word.slice(maxChars)
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function buildPdfLines(document: AdminReportDocument): PdfPrintableLine[] {
  const lines: PdfPrintableLine[] = [
    { text: 'FibroSync', size: 18, bold: true },
    { text: document.title, size: 16, bold: true },
    { text: `Gerado em: ${formatDateTimeValue(document.generatedAt)}`, size: 10 },
  ]

  if (document.generatedBy) {
    lines.push({
      text: `Gerado por: ${document.generatedBy}`,
      size: 10,
    })
  }

  if (document.periodLabel) {
    lines.push({
      text: `Periodo: ${document.periodLabel}`,
      size: 10,
    })
  }

  lines.push({ text: '', size: 10 })
  lines.push({ text: 'Resumo', size: 13, bold: true })

  for (const item of document.summary) {
    for (const line of splitTextIntoLines(`${item.label}: ${item.value}`)) {
      lines.push({ text: line, size: 11 })
    }
  }

  for (const section of document.sections) {
    lines.push({ text: '', size: 10 })
    lines.push({ text: section.title, size: 13, bold: true })

    for (const rawLine of section.lines) {
      const contentLines = splitTextIntoLines(rawLine)

      for (const line of contentLines) {
        lines.push({ text: line, size: 11 })
      }
    }
  }

  return lines
}

function splitPdfLinesIntoPages(lines: PdfPrintableLine[]): PdfPrintableLine[][] {
  const pages: PdfPrintableLine[][] = []
  let currentPage: PdfPrintableLine[] = []
  let currentY = PDF_MARGIN_TOP

  for (const line of lines) {
    const lineHeight = line.size + PDF_LINE_GAP

    if (currentY - lineHeight < PDF_MARGIN_BOTTOM) {
      pages.push(currentPage)
      currentPage = []
      currentY = PDF_MARGIN_TOP
    }

    currentPage.push(line)
    currentY -= lineHeight
  }

  if (currentPage.length > 0) {
    pages.push(currentPage)
  }

  return pages
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

function buildPdfStream(
  pageLines: PdfPrintableLine[],
  pageIndex: number,
  totalPages: number,
): string {
  const commands: string[] = ['BT']
  let currentY = PDF_MARGIN_TOP

  for (const line of pageLines) {
    commands.push(
      `/${line.bold ? 'F2' : 'F1'} ${line.size} Tf 1 0 0 1 ${PDF_MARGIN_LEFT} ${currentY} Tm (${escapePdfText(line.text)}) Tj`,
    )
    currentY -= line.size + PDF_LINE_GAP
  }

  commands.push(
    `/F1 10 Tf 1 0 0 1 ${PDF_MARGIN_LEFT} 30 Tm (Pagina ${pageIndex + 1} de ${totalPages}) Tj`,
  )
  commands.push('ET')

  return commands.join('\n')
}

export function createPdfBlob(document: AdminReportDocument): Blob {
  const pages = splitPdfLinesIntoPages(buildPdfLines(document))
  const maxId = 4 + pages.length * 2
  const objects = new Map<number, string>()
  const pageReferences: string[] = []

  objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>')
  objects.set(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  objects.set(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')

  pages.forEach((pageLines, index) => {
    const pageId = 5 + index * 2
    const contentId = pageId + 1
    const stream = buildPdfStream(pageLines, index, pages.length)

    pageReferences.push(`${pageId} 0 R`)
    objects.set(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    )
    objects.set(
      contentId,
      `<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    )
  })

  objects.set(
    2,
    `<< /Type /Pages /Count ${pages.length} /Kids [${pageReferences.join(' ')}] >>`,
  )

  let pdf = '%PDF-1.4\n'
  const offsets = new Map<number, number>()

  for (let id = 1; id <= maxId; id += 1) {
    const objectBody = objects.get(id)

    if (!objectBody) {
      continue
    }

    offsets.set(id, byteLength(pdf))
    pdf += `${id} 0 obj\n${objectBody}\nendobj\n`
  }

  const xrefOffset = byteLength(pdf)
  pdf += `xref\n0 ${maxId + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let id = 1; id <= maxId; id += 1) {
    const offset = offsets.get(id) ?? 0
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Blob([new TextEncoder().encode(pdf)], {
    type: 'application/pdf',
  })
}

export function createJsonBlob(payload: unknown): Blob {
  return new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const downloadUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = downloadUrl
  anchor.download = fileName
  anchor.click()

  window.setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl)
  }, 400)
}

export function createDownloadBlob(report: AdminReportHistoryItem): Blob {
  return report.format === 'pdf'
    ? createPdfBlob(report.document)
    : createJsonBlob(report.payload)
}

function formatAverage(value: number): string {
  return value.toFixed(1).replace('.', ',')
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, current) => sum + current, 0) / values.length
}

function formatDateTimeValue(value: string): string {
  const date = new Date(value)

  const datePart = STORAGE_DATE_FORMATTER.format(date)
  const timePart = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

  return `${datePart} às ${timePart}`
}

function formatMonthYearValue(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatFileDate(value: string): string {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function resolveAdminReportTypeLabel(type: AdminReport['type']): string {
  if (type === 'users') {
    return 'Usuários'
  }

  if (type === 'crisis') {
    return 'Acompanhamento'
  }

  return 'Analítico'
}

export function buildAdminReportDisplayName(
  type: AdminReport['type'],
  generatedAt: string,
): string {
  if (type === 'users') {
    return `Relatório de Usuários — ${formatMonthYearValue(generatedAt)}`
  }

  if (type === 'crisis') {
    return `Relatório de Acompanhamento — ${formatMonthYearValue(generatedAt)}`
  }

  return `Relatório Analítico — ${formatMonthYearValue(generatedAt)}`
}

export function buildAdminReportFileName(
  type: AdminReport['type'],
  format: AdminReport['format'],
  generatedAt: string,
): string {
  const fileDate = formatFileDate(generatedAt)

  if (type === 'users') {
    return `fibrosync-usuarios-${fileDate}.${format}`
  }

  if (type === 'crisis') {
    return `fibrosync-acompanhamento-${fileDate}.${format}`
  }

  return `fibrosync-analitico-${fileDate}.${format}`
}

function buildFlagCounts(symptoms: AdminSymptomRecord[]): Array<{
  label: string
  count: number
}> {
  const counters = [
    {
      label: 'Dificuldade de concentração',
      count: symptoms.filter((record) => record.cognitiveFog).length,
    },
    {
      label: 'Sensibilidade à luz',
      count: symptoms.filter((record) => record.sensitivityLight).length,
    },
    {
      label: 'Sensibilidade a ruídos',
      count: symptoms.filter((record) => record.sensitivityNoise).length,
    },
    {
      label: 'Questões digestivas',
      count: symptoms.filter((record) => record.digestiveIssues).length,
    },
    {
      label: 'Dor de cabeça',
      count: symptoms.filter((record) => record.headache).length,
    },
    {
      label: 'Ansiedade',
      count: symptoms.filter((record) => record.anxiety).length,
    },
    {
      label: 'Humor depressivo',
      count: symptoms.filter((record) => record.depression).length,
    },
  ]

  return counters.filter((item) => item.count > 0).sort((a, b) => b.count - a.count)
}

function buildRecentVolume(symptoms: AdminSymptomRecord[]): RecentVolumePoint[] {
  const counts = new Map<string, number>()

  for (const record of symptoms) {
    const dateKey = record.createdAt.split('T')[0]
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-10)
}

export function createUsersReportArtifacts(
  users: AdminUser[],
  generatedAt: string,
  generatedBy?: string | null,
): GeneratedReportArtifacts {
  const summary = {
    totalUsers: users.length,
    patients: users.filter((user) => user.role === 'USER').length,
    doctors: users.filter((user) => user.role === 'MEDICAL').length,
    administrators: users.filter((user) => user.role === 'ADMIN').length,
    active: users.filter((user) => user.accountStatus === 'ACTIVE').length,
    pendingProfile: users.filter((user) => user.accountStatus === 'PENDING_PROFILE').length,
    suspended: users.filter((user) => user.accountStatus === 'SUSPENDED').length,
  }

  const payload = {
    reportType: 'USERS',
    reportLabel: 'Relatório de usuários',
    generatedAt,
    generatedBy: generatedBy ?? null,
    summary,
    data: users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      roleLabel: resolveRoleLabel(user.role),
      accountStatus: user.accountStatus,
      accountStatusLabel: resolveAccountStatusLabel(user.accountStatus),
      countryCode: user.countryCode ?? null,
      timezone: user.timezone,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt ?? null,
    })),
  }

  const document: AdminReportDocument = {
    title: 'Relatório de usuários',
    reportLabel: 'Relatório de usuários',
    generatedAt,
    generatedBy: generatedBy ?? null,
    summary: [
      { label: 'Total de usuários', value: String(summary.totalUsers) },
      { label: 'Pacientes', value: String(summary.patients) },
      { label: 'Médicos', value: String(summary.doctors) },
      { label: 'Administradores', value: String(summary.administrators) },
      { label: 'Contas ativas', value: String(summary.active) },
      { label: 'Perfis pendentes', value: String(summary.pendingProfile) },
      { label: 'Contas suspensas', value: String(summary.suspended) },
    ],
    sections: [
      {
        title: 'Usuários',
        lines:
          users.length > 0
            ? users.map(
                (user) =>
                  `${user.fullName} | ${resolveRoleLabel(user.role)} | ${resolveAccountStatusLabel(user.accountStatus)} | Cadastro ${formatDateTimeValue(user.createdAt)}`,
              )
            : ['Nenhuma conta encontrada na base atual.'],
      },
    ],
  }

  return {
    name: buildAdminReportDisplayName('users', generatedAt),
    fileName: buildAdminReportFileName('users', 'json', generatedAt),
    document,
    payload,
  }
}

export function createFollowUpReportArtifacts(
  symptoms: AdminSymptomRecord[],
  generatedAt: string,
  generatedBy?: string | null,
): GeneratedReportArtifacts {
  const flagCounts = buildFlagCounts(symptoms)
  const uniqueUsers = new Set(symptoms.map((record) => record.userId)).size
  const summary = {
    totalRecords: symptoms.length,
    linkedToDailyRecord: symptoms.filter((record) => Boolean(record.dailyRecordId)).length,
    isolatedSignals: symptoms.filter((record) => !record.dailyRecordId).length,
    uniqueUsers,
    averageFatigue: calculateAverage(symptoms.map((record) => record.fatigueLevel)),
    averageSleepQuality: calculateAverage(symptoms.map((record) => record.sleepQuality)),
    averageStiffness: calculateAverage(symptoms.map((record) => record.stiffness)),
    averageMood: calculateAverage(symptoms.map((record) => record.mood)),
    averageStress: calculateAverage(symptoms.map((record) => record.stress)),
  }

  const payload = {
    reportType: 'FOLLOW_UP',
    reportLabel: 'Relatório de acompanhamento',
    generatedAt,
    generatedBy: generatedBy ?? null,
    summary,
    topHighlights: flagCounts.slice(0, 5),
    data: symptoms.map((record) => ({
      id: record.id,
      userId: record.user.id,
      userName: record.user.fullName,
      userEmail: record.user.email,
      linkedToDailyRecord: Boolean(record.dailyRecordId),
      fatigueLevel: record.fatigueLevel,
      sleepQuality: record.sleepQuality,
      stiffness: record.stiffness,
      mood: record.mood,
      stress: record.stress,
      bodyTemperatureFeeling: record.bodyTemperatureFeeling ?? null,
      notes: record.notes ?? null,
      createdAt: record.createdAt,
    })),
  }

  const recentRecords = [...symptoms]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 18)

  const document: AdminReportDocument = {
    title: 'Relatório de acompanhamento',
    reportLabel: 'Relatório de acompanhamento',
    generatedAt,
    generatedBy: generatedBy ?? null,
    summary: [
      { label: 'Registros acompanhados', value: String(summary.totalRecords) },
      { label: 'Ligados ao diário', value: String(summary.linkedToDailyRecord) },
      { label: 'Sinais isolados', value: String(summary.isolatedSignals) },
      { label: 'Usuários com registros', value: String(summary.uniqueUsers) },
      { label: 'Fadiga média', value: `${formatAverage(summary.averageFatigue)}/10` },
      { label: 'Sono médio', value: `${formatAverage(summary.averageSleepQuality)}/10` },
      { label: 'Rigidez média', value: `${formatAverage(summary.averageStiffness)}/10` },
      { label: 'Humor médio', value: `${formatAverage(summary.averageMood)}/10` },
      { label: 'Estresse médio', value: `${formatAverage(summary.averageStress)}/10` },
    ],
    sections: [
      {
        title: 'Destaques observados',
        lines:
          flagCounts.length > 0
            ? flagCounts
                .slice(0, 6)
                .map((item) => `${item.label}: ${item.count} registro(s)`)
            : ['Nenhum destaque adicional foi identificado nos registros atuais.'],
      },
      {
        title: 'Registros recentes',
        lines:
          recentRecords.length > 0
            ? recentRecords.map(
                (record) =>
                  `${record.user.fullName} | Fadiga ${record.fatigueLevel}/10 | Sono ${record.sleepQuality}/10 | Humor ${record.mood}/10 | ${formatDateTimeValue(record.createdAt)}`,
              )
            : ['Nenhum registro de acompanhamento encontrado.'],
      },
    ],
  }

  return {
    name: buildAdminReportDisplayName('crisis', generatedAt),
    fileName: buildAdminReportFileName('crisis', 'json', generatedAt),
    document,
    payload,
  }
}

export function createAnalyticsReportArtifacts(
  users: AdminUser[],
  symptoms: AdminSymptomRecord[],
  generatedAt: string,
  generatedBy?: string | null,
): GeneratedReportArtifacts {
  const flagCounts = buildFlagCounts(symptoms)
  const recentVolume = buildRecentVolume(symptoms)
  const totalSignals = symptoms.length
  const activeUsers = users.filter((user) => user.accountStatus === 'ACTIVE').length
  const patients = users.filter((user) => user.role === 'USER').length
  const doctors = users.filter((user) => user.role === 'MEDICAL').length
  const admins = users.filter((user) => user.role === 'ADMIN').length
  const onboardingReady = users.filter((user) => user.onboardingCompleted).length

  const summary = {
    totalUsers: users.length,
    activeUsers,
    patients,
    doctors,
    administrators: admins,
    totalSignals,
    linkedSignals: symptoms.filter((record) => Boolean(record.dailyRecordId)).length,
    averageSignalsPerUser:
      users.length > 0 ? Number((totalSignals / users.length).toFixed(1)) : 0,
    onboardingReady,
    averageFatigue: calculateAverage(symptoms.map((record) => record.fatigueLevel)),
    averageSleepQuality: calculateAverage(symptoms.map((record) => record.sleepQuality)),
    averageStress: calculateAverage(symptoms.map((record) => record.stress)),
  }

  const payload = {
    reportType: 'ANALYTICS',
    reportLabel: 'Relatório analítico',
    generatedAt,
    generatedBy: generatedBy ?? null,
    summary,
    topPatterns: flagCounts.slice(0, 6),
    volumeByDay: recentVolume,
    averageIndicators: {
      fatigue: summary.averageFatigue,
      sleepQuality: summary.averageSleepQuality,
      stress: summary.averageStress,
    },
  }

  const document: AdminReportDocument = {
    title: 'Relatório analítico',
    reportLabel: 'Relatório analítico',
    generatedAt,
    generatedBy: generatedBy ?? null,
    summary: [
      { label: 'Total de usuários', value: String(summary.totalUsers) },
      { label: 'Contas ativas', value: String(summary.activeUsers) },
      { label: 'Pacientes', value: String(summary.patients) },
      { label: 'Médicos', value: String(summary.doctors) },
      { label: 'Administradores', value: String(summary.administrators) },
      { label: 'Volume de registros', value: String(summary.totalSignals) },
      {
        label: 'Média de registros por usuário',
        value: String(summary.averageSignalsPerUser).replace('.', ','),
      },
      { label: 'Fadiga média', value: `${formatAverage(summary.averageFatigue)}/10` },
      {
        label: 'Qualidade média do sono',
        value: `${formatAverage(summary.averageSleepQuality)}/10`,
      },
      { label: 'Estresse médio', value: `${formatAverage(summary.averageStress)}/10` },
    ],
    sections: [
      {
        title: 'Principais padrões',
        lines:
          flagCounts.length > 0
            ? flagCounts
                .slice(0, 6)
                .map((item) => `${item.label}: ${item.count} ocorrência(s)`)
            : ['Ainda não há padrões suficientes para consolidar.'],
      },
      {
        title: 'Volume recente de registros',
        lines:
          recentVolume.length > 0
            ? recentVolume.map(
                (point) =>
                  `${formatDateTimeValue(`${point.date}T12:00:00.000Z`).split(' às ')[0]}: ${point.total} registro(s)`,
              )
            : ['Nenhum volume recente disponível.'],
      },
    ],
  }

  return {
    name: buildAdminReportDisplayName('analytics', generatedAt),
    fileName: buildAdminReportFileName('analytics', 'json', generatedAt),
    document,
    payload,
  }
}
