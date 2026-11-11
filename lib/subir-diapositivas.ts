export interface DiapositivaAEnviar {
  slide_index: number
  image_data: string
  slide_text: string
}

/**
 * Sube las diapositivas de un curso por lotes.
 *
 * Antes iban todas en un solo envío. Un PDF de 39 páginas convertido a
 * imágenes pesa decenas de megas, y el servidor rechaza una petición así
 * antes siquiera de leerla: el usuario esperaba largo rato, no veía ningún
 * error y el material se quedaba como estaba.
 *
 * Por eso van en tandas de unos pocos megas. La primera borra lo anterior,
 * las siguientes agregan, y la última deja la cuenta y la portada al día.
 * Si una tanda falla, se dice cuál y se corta: más vale saberlo que quedarse
 * con medio curso sin que nadie avise.
 */

/**
 * Lo que cabe en una petición con margen, por peso y por cantidad.
 *
 * El peso lo limita el servidor, que rechaza los envíos grandes. La cantidad
 * la limita el tiempo: cada imagen hay que guardarla en la bodega, y una
 * función tiene unos segundos contados antes de que la corten.
 */
const TOPE_POR_TANDA = 1_500_000
const MAXIMO_POR_TANDA = 6

/**
 * Lo máximo que puede pesar una lámina suelta.
 *
 * Las tandas no sirven de nada si una sola lámina ya no cabe en un envío: el
 * servidor la rechaza igual. Si llega una así, se vuelve a comprimir aquí
 * antes de mandarla, en vez de dejar el curso a medio subir.
 */
const TOPE_POR_LAMINA = 900_000

async function aliviar(dataUrl: string, ancho = 1400, calidad = 0.78): Promise<string> {
  if (!dataUrl || typeof document === 'undefined') return dataUrl
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const escala = img.width > ancho ? ancho / img.width : 1
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * escala)
      canvas.height = Math.round(img.height * escala)
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(dataUrl); return }
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', calidad))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export async function subirDiapositivasEnLotes(
  trainingId: number | string,
  diapositivas: DiapositivaAEnviar[],
  avisar?: (texto: string) => void,
): Promise<{ ok: boolean; guardadas: number; error?: string }> {
  if (!diapositivas.length) {
    // Sin diapositivas igual hay que vaciar lo que hubiera.
    const res = await fetch(`/api/trainings/${trainingId}/slides`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slides: [], reemplazar: true, final: true }),
    })
    return { ok: res.ok, guardadas: 0, error: res.ok ? undefined : 'No se pudo vaciar el material' }
  }

  // Primero las que vengan pesadas, que solas tampoco pasarían.
  const pesadas = diapositivas.filter(d => (d.image_data?.length ?? 0) > TOPE_POR_LAMINA)
  if (pesadas.length) {
    avisar?.(`Aligerando ${pesadas.length} diapositiva${pesadas.length === 1 ? '' : 's'}…`)
    for (const d of pesadas) d.image_data = await aliviar(d.image_data)
  }

  // Tandas por peso, no por cantidad: una lámina con una foto grande pesa
  // mucho más que una de puro texto.
  const tandas: DiapositivaAEnviar[][] = []
  let actual: DiapositivaAEnviar[] = []
  let peso = 0
  for (const d of diapositivas) {
    const suyo = (d.image_data?.length ?? 0) + (d.slide_text?.length ?? 0)
    if (actual.length && (peso + suyo > TOPE_POR_TANDA || actual.length >= MAXIMO_POR_TANDA)) {
      tandas.push(actual); actual = []; peso = 0
    }
    actual.push(d); peso += suyo
  }
  if (actual.length) tandas.push(actual)

  let guardadas = 0
  for (const [i, tanda] of tandas.entries()) {
    avisar?.(`Subiendo diapositivas… ${guardadas + tanda.length} de ${diapositivas.length}`)
    const res = await fetch(`/api/trainings/${trainingId}/slides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slides: tanda,
        reemplazar: i === 0,
        final: i === tandas.length - 1,
      }),
    }).catch(() => null)

    if (!res || !res.ok) {
      const detalle = await res?.json().catch(() => null)
      return {
        ok: false,
        guardadas,
        error: detalle?.error
          ?? (res?.status === 413
            ? 'El archivo es demasiado pesado para subirlo de una. Pruebe con uno más liviano.'
            : `Falló al subir las diapositivas ${guardadas + 1} a ${guardadas + tanda.length}`),
      }
    }
    guardadas += tanda.length
  }

  return { ok: true, guardadas }
}
