import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { randomUUID } from 'crypto'

// ─── Question parser ───────────────────────────────────────────────────────────
// Supported formats in the document:
//
// 1. ¿Pregunta aquí?
// a) Opción incorrecta
// b) Opción correcta *
// c) Opción incorrecta
//
// 2. Afirmación verdadera o falsa
// Verdadero *
// Falso
//
// The correct answer is marked with * at the end.
// Each question block is separated by a blank line.

interface ParsedQuestion {
  text: string
  type: 'single' | 'multiple' | 'true_false'
  options: string[]
  correct: string[]
}

function parseQuestions(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []

  // Normalize line endings and split into blocks by blank lines
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const blocks = normalized.split(/\n{2,}/).map(b => b.trim()).filter(Boolean)

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) continue

    // First line: question text (strip leading number like "1." or "1)")
    const firstLine = lines[0].replace(/^\d+[\.\)]\s*/, '').trim()
    if (!firstLine) continue

    const optionLines = lines.slice(1)
    const options: string[] = []
    const correct: string[] = []

    // Detect true/false question
    const tfKeywords = ['verdadero', 'falso', 'true', 'false', 'v', 'f']
    const isTrueFalse = optionLines.length <= 2 &&
      optionLines.every(l => tfKeywords.some(k => l.toLowerCase().replace(/[^a-záéíóúñ\s]/gi, '').trim() === k || l.toLowerCase().startsWith(k)))

    for (const line of optionLines) {
      const isCorrect = line.endsWith('*') || line.toLowerCase().includes('(correcta)') || line.toLowerCase().includes('(correct)')
      // Strip option prefix (a), b), A., etc.) and markers
      const cleaned = line
        .replace(/^\s*[a-zA-Z]\s*[\.\)]\s*/, '')
        .replace(/\*$/, '')
        .replace(/\(correcta?\)/gi, '')
        .trim()

      if (!cleaned) continue
      options.push(cleaned)
      if (isCorrect) correct.push(cleaned)
    }

    // Skip if no options extracted
    if (options.length === 0) continue

    // Detect multiple correct answers
    const type: ParsedQuestion['type'] = isTrueFalse
      ? 'true_false'
      : correct.length > 1 ? 'multiple' : 'single'

    // For true/false: normalize options
    const finalOptions = isTrueFalse ? ['Verdadero', 'Falso'] : options
    const finalCorrect = isTrueFalse
      ? correct.map(c => c.toLowerCase().startsWith('v') || c.toLowerCase() === 'true' ? 'Verdadero' : 'Falso')
      : correct

    questions.push({ text: firstLine, type, options: finalOptions, correct: finalCorrect })
  }

  return questions
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const evaluationId = formData.get('evaluation_id') as string | null

  if (!file || !evaluationId) {
    return NextResponse.json({ error: 'Faltan archivo o evaluation_id' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let rawText = ''

  try {
    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      rawText = result.value
    } else if (file.name.endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(buffer)
      rawText = data.text
    } else if (file.name.endsWith('.txt')) {
      rawText = buffer.toString('utf-8')
    } else {
      return NextResponse.json({ error: 'Formato no soportado. Usa .docx, .pdf o .txt' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: `Error al leer el archivo: ${e.message}` }, { status: 500 })
  }

  const parsed = parseQuestions(rawText)
  if (parsed.length === 0) {
    return NextResponse.json({
      error: 'No se encontraron preguntas. Revisa el formato: cada pregunta debe tener opciones con * marcando la correcta.',
      raw_preview: rawText.slice(0, 500),
    }, { status: 422 })
  }

  // Get current max order for this evaluation
  const { data: existing } = await supabaseAdmin
    .from('Question')
    .select('order')
    .eq('evaluationId', evaluationId)
    .order('order', { ascending: false })
    .limit(1)

  let nextOrder = ((existing?.[0] as any)?.order ?? 0) + 1

  const savedQuestions = []

  for (const q of parsed) {
    const questionId = randomUUID()
    const dbType = q.type === 'true_false' ? 'TRUE_FALSE' : q.type === 'multiple' ? 'MULTIPLE' : 'SINGLE'

    const { error: qErr } = await supabaseAdmin
      .from('Question')
      .insert({ id: questionId, evaluationId, text: q.text, type: dbType, points: 1, order: nextOrder++ })

    if (qErr) continue

    if (q.options.length > 0) {
      const optRecords = q.options.map((opt, i) => ({
        id: randomUUID(),
        questionId,
        text: opt,
        isCorrect: q.correct.includes(opt),
        order: i + 1,
      }))
      await supabaseAdmin.from('Option').insert(optRecords)
    }

    savedQuestions.push({
      id: questionId,
      evaluation_id: evaluationId,
      text: q.text,
      type: q.type,
      points: 1,
      options: q.options,
      correct: q.correct,
    })
  }

  return NextResponse.json({
    imported: savedQuestions.length,
    total_parsed: parsed.length,
    questions: savedQuestions,
  })
}
