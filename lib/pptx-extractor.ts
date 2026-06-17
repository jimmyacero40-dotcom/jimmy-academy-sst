import JSZip from 'jszip'

const DB_NAME = 'sst-slides-db'
const STORE_NAME = 'slides'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveCourseData(courseId: number, data: { images: string[]; texts: string[] }): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).put(data, `course-${courseId}`)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getCourseData(courseId: number): Promise<{ images: string[]; texts: string[] }> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const req = tx.objectStore(STORE_NAME).get(`course-${courseId}`)
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const result = req.result
      if (Array.isArray(result)) {
        resolve({ images: result, texts: [] })
      } else if (result && result.images) {
        resolve(result)
      } else {
        resolve({ images: [], texts: [] })
      }
    }
    req.onerror = () => reject(req.error)
  })
}

export type CustomQuestion = { q: string; options: string[]; correct: number; explanation: string }

export async function saveCustomQuestions(courseId: number, questions: CustomQuestion[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).put(questions, `questions-${courseId}`)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getCustomQuestions(courseId: number): Promise<CustomQuestion[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const req = tx.objectStore(STORE_NAME).get(`questions-${courseId}`)
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

export async function saveSlides(courseId: number, images: string[]): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).put(images, `course-${courseId}`)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getSlides(courseId: number): Promise<string[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const req = tx.objectStore(STORE_NAME).get(`course-${courseId}`)
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

export async function deleteSlides(courseId: number): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).delete(`course-${courseId}`)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function extractPPTXImages(file: File): Promise<string[]> {
  const zip = await JSZip.loadAsync(file)
  const images: { index: number; data: string }[] = []

  // PPTX stores slide relationships in ppt/slides/_rels/slideN.xml.rels
  // and images in ppt/media/
  // We need to map slides to their images in order

  // First, get all slide files to know the count
  const slideFiles: string[] = []
  zip.forEach((path) => {
    const match = path.match(/^ppt\/slides\/slide(\d+)\.xml$/)
    if (match) slideFiles.push(path)
  })
  slideFiles.sort((a, b) => {
    const na = parseInt(a.match(/slide(\d+)/)?.[1] || '0')
    const nb = parseInt(b.match(/slide(\d+)/)?.[1] || '0')
    return na - nb
  })

  // For each slide, find its main image from the relationship file
  for (let i = 0; i < slideFiles.length; i++) {
    const slideNum = slideFiles[i].match(/slide(\d+)/)?.[1]
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`
    const relsFile = zip.file(relsPath)

    if (relsFile) {
      const relsXml = await relsFile.async('text')
      // Find all image references
      const imgMatches = [...relsXml.matchAll(/Target="\.\.\/media\/(image[^"]+)"/g)]

      if (imgMatches.length > 0) {
        // Get the largest image for this slide (usually the main slide image)
        let bestImage = ''
        let bestSize = 0

        for (const match of imgMatches) {
          const imgPath = `ppt/media/${match[1]}`
          const imgFile = zip.file(imgPath)
          if (imgFile) {
            const blob = await imgFile.async('blob')
            if (blob.size > bestSize) {
              bestSize = blob.size
              const ext = match[1].split('.').pop()?.toLowerCase() || 'png'
              const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'svg' ? 'image/svg+xml' : ext === 'emf' || ext === 'wmf' ? 'skip' : `image/${ext}`
              if (mime !== 'skip') {
                bestImage = await blobToDataURL(blob, mime)
              }
            }
          }
        }

        if (bestImage) {
          images.push({ index: i, data: bestImage })
        }
      }
    }
  }

  // If no relationship-based images found, fall back to extracting all media images
  if (images.length === 0) {
    const mediaFiles: { name: string; file: JSZip.JSZipObject }[] = []
    zip.forEach((path, file) => {
      if (path.startsWith('ppt/media/') && /\.(png|jpg|jpeg|gif|bmp)$/i.test(path)) {
        mediaFiles.push({ name: path, file })
      }
    })
    mediaFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

    for (let i = 0; i < mediaFiles.length; i++) {
      const blob = await mediaFiles[i].file.async('blob')
      const ext = mediaFiles[i].name.split('.').pop()?.toLowerCase() || 'png'
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
      const dataUrl = await blobToDataURL(blob, mime)
      images.push({ index: i, data: dataUrl })
    }
  }

  images.sort((a, b) => a.index - b.index)
  return images.map(img => img.data)
}

export async function extractPPTXTexts(file: File): Promise<string[]> {
  const zip = await JSZip.loadAsync(file)
  const slideFiles: string[] = []
  zip.forEach((path) => {
    if (/^ppt\/slides\/slide\d+\.xml$/.test(path)) slideFiles.push(path)
  })
  slideFiles.sort((a, b) => {
    const na = parseInt(a.match(/slide(\d+)/)?.[1] || '0')
    const nb = parseInt(b.match(/slide(\d+)/)?.[1] || '0')
    return na - nb
  })

  const texts: string[] = []
  for (const slidePath of slideFiles) {
    const slideFile = zip.file(slidePath)
    if (slideFile) {
      const xml = await slideFile.async('text')
      // Extract all text content from <a:t> tags
      const textMatches = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
      const slideText = textMatches.map(m => m[1].trim()).filter(t => t.length > 0).join(' ')
      if (slideText) texts.push(slideText)
    }
  }
  return texts
}

function blobToDataURL(blob: Blob, mime: string): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(new Blob([blob], { type: mime }))
  })
}
