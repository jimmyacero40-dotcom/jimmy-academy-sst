'use client'

import { MessageSquare } from 'lucide-react'
import { ModuloEnPreparacion } from '@/components/ModuloEnPreparacion'

export default function TuCuentasPage() {
  return (
    <ModuloEnPreparacion
      titulo="Tú Cuentas"
      bajada="Tu espacio para participar"
      icono={MessageSquare}
      acento="#8B5CF6"
      descripcion="Aquí vas a poder contar lo que ves en tu trabajo: una condición insegura, una idea para mejorar o algo que te preocupa. Estamos preparando este espacio."
    />
  )
}
