import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getDashboardStats, getFallbackQuestions, getLogs } from '@/services/adminService'
import { getSUSStats } from '@/services/susService'
import { exportReportPDF } from '@/utils/exportUtils'

export function ReportExportButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const [stats, susStats, logsData, fallbackQuestions] = await Promise.allSettled([
        getDashboardStats(7),
        getSUSStats(),
        getLogs({ page: 1, pageSize: 100 }),
        getFallbackQuestions(30, 20),
      ])

      exportReportPDF({
        stats:             stats.status             === 'fulfilled' ? stats.value             : null,
        susStats:          susStats.status          === 'fulfilled' ? susStats.value          : null,
        logs:              logsData.status          === 'fulfilled' ? logsData.value.logs     : [],
        fallbackQuestions: fallbackQuestions.status === 'fulfilled' ? fallbackQuestions.value : [],
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <FileDown className="w-4 h-4" />
      }
      {loading ? 'Génération…' : 'Rapport PDF'}
    </Button>
  )
}
