/**
 * Volver al principio de la pantalla al cambiar de paso o de sección.
 *
 * En el tablero el contenido no se desplaza en la ventana sino dentro de
 * `<main>`, así que `window.scrollTo` no movía nada: en el celular la persona
 * pasaba a la sección siguiente y la veía empezada por la mitad, o derecho en
 * el botón de continuar. Parecía que ya no hubiera más preguntas, y por eso
 * quedaban formularios a medio responder.
 *
 * Se mueven los dos —el contenedor y la ventana— porque hay pantallas fuera
 * del tablero, como el pre-registro, donde sí se desplaza la ventana.
 */
export function irArriba() {
  try {
    const suave: ScrollToOptions = { top: 0, behavior: 'smooth' }
    document.querySelector('main')?.scrollTo(suave)
    window.scrollTo(suave)
  } catch {
    /* Navegador que no lo soporta: se queda donde estaba, no es grave. */
  }
}
