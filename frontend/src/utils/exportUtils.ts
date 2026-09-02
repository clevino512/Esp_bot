import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CellHookData } from 'jspdf-autotable'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ConversationLog, DashboardStats } from '@/types'
import type { SUSStats } from '@/services/susService'
import type { FallbackQuestion } from '@/services/adminService'
import { getSUSGrade } from '@/services/susService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob(['\ufeff' + content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toCsvRow(cells: (string | number | null | undefined)[]) {
  return cells.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')
}

function pageWidth(doc: jsPDF) { return doc.internal.pageSize.getWidth() }
function pageHeight(doc: jsPDF) { return doc.internal.pageSize.getHeight() }

function needsNewPage(doc: jsPDF, y: number, needed = 40): number {
  if (y + needed > pageHeight(doc) - 15) {
    doc.addPage()
    return 20
  }
  return y
}

// ─── Color palette ─────────────────────────────────────────────────────────

const PRIMARY   = [37, 99, 235]  as [number, number, number]
const SUCCESS   = [16, 185, 129] as [number, number, number]
const WARNING   = [245, 158, 11] as [number, number, number]
const SKY       = [14, 165, 233] as [number, number, number]
const DARK      = [17, 24, 39]   as [number, number, number]
const MID       = [107, 114, 128] as [number, number, number]
const LIGHT_BG  = [249, 250, 251] as [number, number, number]
const BORDER    = [229, 231, 235] as [number, number, number]

// ─── Drawing primitives ────────────────────────────────────────────────────

function drawKpiBox(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  label: string, value: string,
  accent: [number, number, number]
) {
  doc.setFillColor(...([255, 255, 255] as [number, number, number]))
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, w, h, 2, 2, 'FD')

  doc.setFillColor(...accent)
  doc.roundedRect(x, y, 3, h, 1, 1, 'F')

  doc.setTextColor(...DARK)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(value, x + 7, y + h / 2 + 1)

  doc.setTextColor(...MID)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(label, x + 7, y + h / 2 + 7)
}

function drawSectionHeader(doc: jsPDF, y: number, title: string) {
  const margin = 15
  doc.setTextColor(...DARK)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin, y)
  doc.setDrawColor(...PRIMARY)
  doc.setLineWidth(0.5)
  doc.line(margin, y + 2, pageWidth(doc) - margin, y + 2)
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pw = pageWidth(doc)
  const ph = pageHeight(doc)
  doc.setFillColor(...LIGHT_BG)
  doc.rect(0, ph - 10, pw, 10, 'F')
  doc.setTextColor(...MID)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text("UniBot ESPA — PFE STIC 2025-2026 | École Supérieure Polytechnique d'Antsiranana", margin, ph - 3.5)
  doc.text(`Page ${pageNum} / ${totalPages}`, pw - margin, ph - 3.5, { align: 'right' })
}

const margin = 15

// ─── CSV Export ────────────────────────────────────────────────────────────

export function exportLogsCSV(logs: ConversationLog[]) {
  const headers = [
    'Date', 'Heure', 'Question', 'Réponse',
    'Confiance', 'Statut', 'Mode', 'Retour utilisateur', 'Session (12 car.)',
  ]
  const rows = logs.map(l => {
    const dt = parseISO(l.timestamp)
    const feedback =
      l.feedback === 'helpful' || l.feedback === 'positive' ? 'Utile' :
      l.feedback === 'not_helpful' || l.feedback === 'negative' ? 'Pas utile' : ''
    return [
      format(dt, 'dd/MM/yyyy', { locale: fr }),
      format(dt, 'HH:mm:ss'),
      l.query || l.userQuestion || '',
      l.response || l.botResponse || '',
      `${Math.round(l.confidence * 100)}%`,
      l.status,
      l.mode === 'voice' ? 'Vocal' : 'Texte',
      feedback,
      l.sessionId.slice(0, 12),
    ]
  })

  const csv = [toCsvRow(headers), ...rows.map(toCsvRow)].join('\n')
  const filename = `unibot_conversations_${format(new Date(), 'yyyy-MM-dd')}.csv`
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;')
}

// ─── PDF Report ────────────────────────────────────────────────────────────

export interface ReportData {
  stats: DashboardStats | null
  susStats: SUSStats | null
  logs: ConversationLog[]
  fallbackQuestions: FallbackQuestion[]
}

export function exportReportPDF(data: ReportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pw = pageWidth(doc)
  const now = new Date()

  // ── Page 1: Header ──────────────────────────────────────────────────────

  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pw, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('UniBot ESPA', margin, 17)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Assistant Virtuel Universitaire — Rapport d\'analyse', margin, 25)

  doc.setFontSize(8)
  doc.text("École Supérieure Polytechnique d'Antsiranana", pw - margin, 14, { align: 'right' })
  doc.text('Université d\'Antsiranana, Madagascar', pw - margin, 20, { align: 'right' })
  doc.text(`Généré le ${format(now, "d MMMM yyyy 'à' HH:mm", { locale: fr })}`, pw - margin, 26, { align: 'right' })
  if (data.stats?.periodStart && data.stats?.periodEnd) {
    const from = format(parseISO(data.stats.periodStart), 'd MMM', { locale: fr })
    const to   = format(parseISO(data.stats.periodEnd),   'd MMM yyyy', { locale: fr })
    doc.text(`Période analysée : ${from} – ${to}`, pw - margin, 32, { align: 'right' })
  }

  // ── KPI Row 1 ────────────────────────────────────────────────────────────

  let y = 50
  drawSectionHeader(doc, y, 'INDICATEURS CLÉS')
  y += 8

  const s = data.stats
  const boxW = (pw - margin * 2 - 9) / 4
  const boxH = 22

  const row1 = [
    { label: 'Conversations totales', value: String(s?.totalConversations ?? 0), color: PRIMARY },
    { label: 'Taux de satisfaction',  value: s?.helpfulRate  != null ? `${Math.round(s.helpfulRate  * 100)}%` : 'N/A', color: SUCCESS },
    { label: 'Confiance moyenne',     value: s?.avgConfidence != null ? `${Math.round(s.avgConfidence * 100)}%` : 'N/A', color: SKY },
    { label: 'Taux fallback',         value: s?.fallbackRate  != null ? `${Math.round(s.fallbackRate  * 100)}%` : 'N/A', color: WARNING },
  ]
  row1.forEach((k, i) => drawKpiBox(doc, margin + i * (boxW + 3), y, boxW, boxH, k.label, k.value, k.color))
  y += boxH + 4

  const row2 = [
    { label: 'Documents actifs',       value: String(s?.activeDocuments ?? s?.totalDocuments ?? 0), color: PRIMARY },
    { label: 'Chunks vectorisés',      value: String(s?.totalChunks ?? 0),                          color: SUCCESS },
    { label: 'Utilisateurs uniques',   value: String(s?.uniqueUsers ?? 0),                          color: SKY },
    { label: 'Temps de réponse moy.', value: s?.avgResponseTime ? `${(s.avgResponseTime / 1000).toFixed(1)}s` : 'N/A', color: WARNING },
  ]
  row2.forEach((k, i) => drawKpiBox(doc, margin + i * (boxW + 3), y, boxW, boxH, k.label, k.value, k.color))
  y += boxH + 10

  // ── SUS Section ──────────────────────────────────────────────────────────

  if (data.susStats && data.susStats.count > 0) {
    y = needsNewPage(doc, y, 65)
    drawSectionHeader(doc, y, "ÉVALUATION D'UTILISABILITÉ (SUS — System Usability Scale)")
    y += 8

    const grade = getSUSGrade(data.susStats.avgScore)

    doc.setFillColor(219, 234, 254)
    doc.setDrawColor(...PRIMARY)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, y, pw - margin * 2, 24, 2, 2, 'FD')

    doc.setTextColor(...DARK)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(`${Math.round(data.susStats.avgScore)}/100`, margin + 8, y + 14)

    doc.setTextColor(...MID)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`${data.susStats.count} évaluation${data.susStats.count > 1 ? 's' : ''}`, margin + 8, y + 20)

    doc.setTextColor(...DARK)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Grade ${grade.grade} — ${grade.label}`, pw / 2, y + 11, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MID)
    doc.text(grade.description, pw / 2, y + 18, { align: 'center', maxWidth: 80 })

    doc.setFontSize(8)
    doc.text(`Min : ${Math.round(data.susStats.minScore)} | Max : ${Math.round(data.susStats.maxScore)}`, pw - margin - 4, y + 11, { align: 'right' })

    y += 28

    if (data.susStats.distribution?.length) {
      autoTable(doc, {
        head: [['Plage de scores', 'Évaluations', 'Proportion']],
        body: data.susStats.distribution.map(d => [
          d.range,
          String(d.count),
          data.susStats!.count > 0 ? `${Math.round((d.count / data.susStats!.count) * 100)}%` : '0%',
        ]),
        startY: y,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: LIGHT_BG },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 35, halign: 'center' },
        },
      })
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    }
  }

  // ── Fallback questions ────────────────────────────────────────────────────

  if (data.fallbackQuestions.length > 0) {
    y = needsNewPage(doc, y, 55)
    drawSectionHeader(doc, y, `QUESTIONS SANS RÉPONSE (HORS DOMAINE) — ${data.fallbackQuestions.length} question${data.fallbackQuestions.length > 1 ? 's' : ''}`)
    y += 5

    autoTable(doc, {
      head: [['Question posée par l\'utilisateur', 'Occurrences', 'Dernière occurrence']],
      body: data.fallbackQuestions.map(q => [
        q.question,
        String(q.count),
        q.last_seen ? format(parseISO(q.last_seen), 'd MMM yyyy', { locale: fr }) : '—',
      ]),
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: WARNING, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 28, halign: 'center' },
        2: { cellWidth: 38, halign: 'center' },
      },
    })
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // ── Conversation logs table ───────────────────────────────────────────────

  if (data.logs.length > 0) {
    y = needsNewPage(doc, y, 55)
    drawSectionHeader(doc, y, `JOURNAL DES CONVERSATIONS — ${data.logs.length} entrée${data.logs.length > 1 ? 's' : ''}`)
    y += 5

    const STATUS_FR: Record<string, string> = {
      resolved: 'Résolu', answered: 'Répondu',
      fallback: 'Hors domaine', unanswered: 'Sans réponse', escalated: 'Escaladé',
    }

    autoTable(doc, {
      head: [['Date / Heure', 'Question posée', 'Statut', 'Conf.', 'Mode', 'Retour']],
      body: data.logs.map(l => {
        const dt = parseISO(l.timestamp)
        const query = (l.query || l.userQuestion || '').slice(0, 80)
        const feedback =
          l.feedback === 'helpful'    || l.feedback === 'positive'    ? 'Utile' :
          l.feedback === 'not_helpful' || l.feedback === 'negative' ? 'Pas utile' : '—'
        return [
          format(dt, 'dd/MM HH:mm'),
          query + (query.length === 80 ? '…' : ''),
          STATUS_FR[l.status] || l.status,
          `${Math.round(l.confidence * 100)}%`,
          l.mode === 'voice' ? 'Vocal' : 'Texte',
          feedback,
        ]
      }),
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 13, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
      },
      didParseCell: (hookData: CellHookData) => {
        if (hookData.column.index === 2 && hookData.section === 'body') {
          const val = hookData.cell.raw as string
          if (val === 'Hors domaine' || val === 'Sans réponse') {
            hookData.cell.styles.textColor = [180, 83, 9]
          } else {
            hookData.cell.styles.textColor = [5, 150, 105]
          }
        }
        if (hookData.column.index === 5 && hookData.section === 'body') {
          const val = hookData.cell.raw as string
          if (val === 'Utile') hookData.cell.styles.textColor = [5, 150, 105]
          else if (val === 'Pas utile') hookData.cell.styles.textColor = [220, 38, 38]
        }
      },
    })
  }

  // ── Footers on every page ─────────────────────────────────────────────────

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  doc.save(`rapport_unibot_${format(now, 'yyyy-MM-dd_HH-mm')}.pdf`)
}
