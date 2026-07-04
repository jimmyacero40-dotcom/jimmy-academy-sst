import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { randomUUID } from 'crypto'

// ─── Parser ───────────────────────────────────────────────────────────────────
//
// Handles any of these formats:
//
// FORMAT A (user's Word format - options on same line, concatenated):
//   ¿Pregunta?
//   (blank line)
//   A. Opción.B. Opción correcta. *C. Opción.D. Opción.
//
// FORMAT B (classic - each option on its own line):
//   1. ¿Pregunta?
//   a) Opción
//   b) Opción correcta *
//   c) Opción
//
// FORMAT C (mixed / any combination)
//
// Correct answer marker: * anywhere in/after the option text

interface ParsedQuestion {
  text: string
  type: 'single' | 'multiple' | 'true_false'
  options: string[]
  correct: string[]
}

function parseOptions(raw: string): { options: string[]; correct: string[] } {
  const options: string[] = []
  const correct: string[] = []

  // Try multi-choice: split on letter-dot pattern A. B. C. etc.
  // Works for both concatenated and newline-separated options
  const unifiedRaw = raw.replace(/\n/g, ' ')

  // Match: letter (A-J), dot or paren, optional space, then text until next such pattern or end
  const optionRegex = /[A-J][\.\)]\s*([\s\S]*?)(?=\s*[A-J][\.\)]|$)/g
  const matches = [...unifiedRaw.matchAll(optionRegex)]

  if (matches.length >= 2) {
    for (const m of matches) {
      const rawText = m[1].trim()
      const isCorrect = rawText.includes('*')
      const cleaned = rawText.replace(/\*/g, '').trim().replace(/\s+/g, ' ')
      if (cleaned) {
        options.push(cleaned)
        if (isCorrect) correct.push(cleaned)
      }
    }
    return { options, correct }
  }

  // Fallback: parse line by line (each line is an option)
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    const isCorrect = line.includes('*')
    const cleaned = line
      .replace(/^\s*[a-zA-Z]\s*[\.\)]\s*/, '')
      .replace(/\*/g, '')
      .trim()
    if (cleaned) {
      options.push(cleaned)
      if (isCorrect) correct.push(cleaned)
    }
  }
  return { options, correct }
}

function isTrueFalse(raw: string): boolean {
  const lower = raw.toLowerCase().replace(/\*/g, '').trim()
  // Matches if all content is just true/false/verdadero/falso keywords
  const tfWords = /^[\s\nA-Eab.\)]*?(verdadero|falso|true|false|v\b|f\b)[\s\nA-Eab.\)]*?(verdadero|falso|true|false|v\b|f\b)[\s\*]*$/i
  return tfWords.test(lower)
}

function parseTrueFalse(raw: string): { options: string[]; correct: string[] } {
  const options = ['Verdadero', 'Falso']
  const correct: string[] = []
  const lines = raw.split(/\n|(?=[A-E][\.\)])/).map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    if (line.includes('*')) {
      const isTrue = /verdadero|true|^\s*v[\.\)]?\s*$/i.test(line.replace(/\*/g, ''))
      correct.push(isTrue ? 'Verdadero' : 'Falso')
    }
  }
  // Fallback: if * in raw, check which V/F has it
  if (correct.length === 0 && raw.includes('*')) {
    const verdaderoCorrect = /verdadero[^a-z]*\*/i.test(raw) || /\*[^a-z]*verdadero/i.test(raw)
    correct.push(verdaderoCorrect ? 'Verdadero' : 'Falso')
  }
  return { options, correct }
}

function looksLikeQuestion(text: string): boolean {
  return text.includes('?') || /^\d+[\.\)]\s/.test(text) || text.length > 20
}

function looksLikeOptions(text: string): boolean {
  // Starts with a letter option marker
  return /^[A-Ja-j][\.\)]\s/.test(text.trim()) ||
    // Or contains inline option markers like "A. ...B. ..."
    /[A-J][\.\)]\s.{3,}[A-J][\.\)]\s/.test(text)
}

function parseQuestions(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Split into blocks separated by blank lines
  const blocks = normalized
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(Boolean)

  let i = 0
  while (i < blocks.length) {
    const block = blocks[i]

    // Case 1: block contains both question and options (classic format)
    if (looksLikeQuestion(block) && looksLikeOptions(block)) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
      // First line is question, rest are options
      const questionText = lines[0].replace(/^\d+[\.\)]\s*/, '').trim()
      const optionsRaw = lines.slice(1).join('\n')

      if (optionsRaw && questionText) {
        const tf = isTrueFalse(optionsRaw)
        const { options, correct } = tf ? parseTrueFalse(optionsRaw) : parseOptions(optionsRaw)
        if (options.length >= 2) {
          questions.push({
            text: questionText,
            type: tf ? 'true_false' : correct.length > 1 ? 'multiple' : 'single',
            options, correct,
          })
        }
      }
      i++
      continue
    }

    // Case 2: question block followed by options block (user's Word format)
    if (looksLikeQuestion(block) && !looksLikeOptions(block)) {
      const questionText = block.replace(/^\d+[\.\)]\s*/, '').trim()
      const nextBlock = i + 1 < blocks.length ? blocks[i + 1] : ''

      if (nextBlock && looksLikeOptions(nextBlock)) {
        const tf = isTrueFalse(nextBlock)
        const { options, correct } = tf ? parseTrueFalse(nextBlock) : parseOptions(nextBlock)
        if (options.length >= 2 && questionText) {
          questions.push({
            text: questionText,
            type: tf ? 'true_false' : correct.length > 1 ? 'multiple' : 'single',
            options, correct,
          })
        }
        i += 2
        continue
      }
    }

    i++
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
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
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
      error: 'No se detectaron preguntas. Asegúrate de que las opciones usen letras (A. B. C.) y marca la correcta con *',
      raw_preview: rawText.slice(0, 800),
    }, { status: 422 })
  }

  // Get current max order
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
      await supabaseAdmin.from('Option').insert(
        q.options.map((opt, idx) => ({
          id: randomUUID(),
          questionId,
          text: opt,
          isCorrect: q.correct.includes(opt),
          order: idx + 1,
        }))
      )
    }

    savedQuestions.push({ id: questionId, evaluation_id: evaluationId, text: q.text, type: q.type, points: 1, options: q.options, correct: q.correct })
  }

  return NextResponse.json({ imported: savedQuestions.length, total_parsed: parsed.length, questions: savedQuestions })
}
