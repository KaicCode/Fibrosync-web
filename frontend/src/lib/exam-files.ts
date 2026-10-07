export const MAX_EXAM_FILES = 5
export const MAX_EXAM_BYTES = 10 * 1024 * 1024
export const EXAM_FILE_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

export function validateExamSelection(files: File[]): string | null {
  if (files.length > MAX_EXAM_FILES)
    return 'Você pode anexar até 5 exames por registro.'
  for (const file of files) {
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      return `O arquivo "${file.name}" deve ser um PDF, JPG ou PNG.`
    }
    if (!file.size || file.size > MAX_EXAM_BYTES) {
      return `O arquivo "${file.name}" deve ter no máximo 10 MB e não pode estar vazio.`
    }
  }
  return null
}

export function formatExamSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.ceil(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
