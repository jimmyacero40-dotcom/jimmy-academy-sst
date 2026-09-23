/**
 * Las contraseñas se guardan cifradas con bcrypt, que es de una sola vía: el
 * sistema puede comprobar si una clave coincide, pero no recuperarla. Por eso no
 * existe "ver la contraseña actual": lo que se ofrece es asignar una nueva y
 * mostrarla en el momento para poder entregarla.
 */
export function generarClave() {
  const letras  = 'ABCDEFGHJKLMNPQRSTUVWXYZ'   // sin I ni O: se confunden al dictar
  const numeros = '23456789'                    // sin 0 ni 1
  const trozo = (fuente: string, n: number) =>
    Array.from({ length: n }, () => fuente[Math.floor(Math.random() * fuente.length)]).join('')
  return trozo(letras, 3) + trozo(numeros, 4)
}
