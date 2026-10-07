import { useState } from 'react'
import { Download, FileText, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatExamSize } from '@/lib/exam-files'
import { dailyRecordService } from '@/services/daily-record.service'
import type { ExamAttachment } from '@/services/daily-record.service'
import { toast } from '@/store/toast-store'

export function RecordExams({
  recordId,
  exams,
}: {
  recordId: string
  exams?: ExamAttachment[]
}) {
  const [downloading, setDownloading] = useState<string | null>(null)
  if (!exams?.length) return null

  async function download(exam: ExamAttachment) {
    setDownloading(exam.id)
    try {
      await dailyRecordService.downloadExam(recordId, exam)
    } catch {
      toast.error(
        'Não foi possível baixar o exame',
        'Tente novamente em alguns instantes.',
      )
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm font-semibold text-foreground">Exames</p>
      {exams.map((exam) => (
        <div
          key={exam.id}
          className="flex items-center gap-2 rounded-xl bg-violet-50/70 px-3 py-2"
        >
          <FileText
            className="h-4 w-4 shrink-0 text-violet-600"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {exam.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatExamSize(exam.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={downloading !== null}
            aria-label={`Baixar ${exam.name}`}
            onClick={() => void download(exam)}
          >
            {downloading === exam.id ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  )
}
