import { Share, SquarePlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type InstallPwaModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const steps = [
  {
    icon: Share,
    text: 'Toque no botão Compartilhar do Safari.',
  },
  {
    icon: SquarePlus,
    text: 'Selecione "Adicionar à Tela de Início".',
  },
  {
    icon: null,
    text: 'Confirme em "Adicionar".',
  },
]

export function InstallPwaModal({ open, onOpenChange }: InstallPwaModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Instalar FibroSync no iPhone</DialogTitle>
          <DialogDescription>
            O Safari não permite instalar automaticamente — siga os passos abaixo.
          </DialogDescription>
        </DialogHeader>

        <ol className="mt-5 space-y-3">
          {steps.map((step, index) => (
            <li
              key={step.text}
              className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-soft"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
                {index + 1}
              </span>
              <span className="flex-1 text-sm text-foreground">{step.text}</span>
              {step.icon ? (
                <step.icon className="h-4 w-4 shrink-0 text-brand-600" />
              ) : null}
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  )
}
