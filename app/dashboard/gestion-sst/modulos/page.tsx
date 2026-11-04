import { redirect } from 'next/navigation'

// Los módulos se listan junto a la identificación de peligros, en Tú Cuentas.
// Esta dirección se deja viva porque puede estar guardada en un favorito.
export default function ModulosRedirige() {
  redirect('/dashboard/gestion-sst/tu-cuentas')
}
