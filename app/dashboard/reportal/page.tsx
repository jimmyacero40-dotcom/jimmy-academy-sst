'use client'

import { FileText } from 'lucide-react'
import { ModuloEnPreparacion } from '@/components/ModuloEnPreparacion'

export default function RePortalPage() {
  return (
    <ModuloEnPreparacion
      titulo="RePortal"
      bajada="Tus reportes en un solo lugar"
      icono={FileText}
      acento="#06B6D4"
      descripcion="Aquí vas a encontrar los reportes que te correspondan y el seguimiento de los que hayas enviado. Estamos preparando este espacio."
    />
  )
}
