// ─────────────────────────────────────────────────────────────────────────────
// INTELLIGENT QUESTION PARSER
// Algorithm: line-by-line classification → state machine grouping
// Handles: spaced (1 option per paragraph), compact (all on consecutive lines),
//          numbered options, bullet options, True/False, and explicit answer keys.
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedQuestion {
  question: string
  options: string[]
  correct_index: number  // -1 = not yet selected
  explanation: string
  type: 'single' | 'true_false'
}

// ── Line classification types ────────────────────────────────────────────────

type LineInfo =
  | { kind: 'empty' }
  | { kind: 'numbered_q'; num: number; rest: string }   // "1. Pregunta..."
  | { kind: 'letter_opt'; letter: string; text: string } // "A. Opción..."
  | { kind: 'num_opt'; num: number; text: string }       // "1. Opción..."
  | { kind: 'bullet_opt'; text: string }                 // "• Opción..."
  | { kind: 'answer_key'; raw: string }                  // "Respuesta correcta: B"
  | { kind: 'tf_label' }                                 // "Verdadero o Falso"
  | { kind: 'text'; text: string }

// Patterns that mark the start of an answer key line
const ANSWER_PATTERNS: RegExp[] = [
  /^(?:la\s+)?respuesta\s+correcta\s*[:.]\s*(.+)$/i,
  /^(?:la\s+)?respuesta\s*[:.]\s*(.+)$/i,
  /^correcta\s*[:.]\s*(.+)$/i,
  /^correct(?:a)?\s*[:.]\s*(.+)$/i,
  /^answer\s*[:.]\s*(.+)$/i,
  /^r\s*\/\s*[:.:]?\s*(.+)$/i,
  /^rpta\.?\s*[:.]\s*(.+)$/i,
  /^clave\s*[:.]\s*(.+)$/i,
]

// Strip markdown bold/italic from a line
function stripMarkdown(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim()
}

// Classify one line
function classifyLine(raw: string): LineInfo {
  const t = stripMarkdown(raw.trim())
  if (!t) return { kind: 'empty' }

  // True/False standalone label (before numbered_q to catch "Verdadero o Falso" alone)
  if (/^(verdadero\s+[uo]\s+falso|verdadero\/falso|true\s+or\s+false|true\/false|v\s*\/\s*f)[\s:]*$/i.test(t)) {
    return { kind: 'tf_label' }
  }

  // Answer key — check BEFORE numbered_q to catch "Respuesta: B" without false positives
  for (const pat of ANSWER_PATTERNS) {
    const m = t.match(pat)
    if (m) {
      const ans = m[1].trim()
      // Sanity: answer token should be short (letter, word, or short phrase)
      if (ans.length <= 50) {
        return { kind: 'answer_key', raw: ans }
      }
    }
  }

  // Numbered question: "1.", "2)", "Q1.", "Pregunta 1:", etc.
  // Must be a reasonable question number (1-200)
  const nqM = t.match(/^(?:(?:pregunta|question|q)\s*)?(\d{1,3})[).:\s]\s*(.*)/i)
  if (nqM) {
    const num = parseInt(nqM[1])
    if (num >= 1 && num <= 200) {
      return { kind: 'numbered_q', num, rest: nqM[2].trim() }
    }
  }

  // Letter option: uppercase or lowercase A-H followed by ". " or ") "
  const loM = t.match(/^([A-Ha-h])[).]\s+(.+)$/)
  if (loM) {
    return { kind: 'letter_opt', letter: loM[1].toUpperCase(), text: loM[2].trim() }
  }

  // Numeric option: 1-8 followed by ". " or ") "
  const noM = t.match(/^([1-8])[).]\s+(.+)$/)
  if (noM) {
    return { kind: 'num_opt', num: parseInt(noM[1]), text: noM[2].trim() }
  }

  // Bullet option
  const boM = t.match(/^[•\-\*→▸✓○●✗✘]\s+(.+)$/)
  if (boM) {
    return { kind: 'bullet_opt', text: boM[1].trim() }
  }

  return { kind: 'text', text: t }
}

// True when a piece of text reads like a question (heuristic)
function looksLikeQuestion(text: string): boolean {
  const t = text.toLowerCase()
  return t.includes('?') ||
    t.includes('¿') ||
    text.length > 80 ||
    /\b(qué|cuál|cuáles|cómo|dónde|cuándo|cuántos|cuántas|por qué|quién|quiénes|what|which|how|where|when|who|why)\b/i.test(t)
}

// True when a string reads like a T/F header embedded in question text
function textIsTFLabel(text: string): boolean {
  return /^(verdadero\s+[uo]\s+falso|verdadero\/falso|true\s+or\s+false|true\/false|v\s*\/\s*f)[\s:]*$/i.test(text.trim())
}

// ── Answer resolution ────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function resolveAnswer(raw: string, options: string[]): number {
  // Strip optional prefix like "b) Bogotá" → extract "b"
  const prefixM = raw.match(/^([A-Ha-h])[).]\s*/)
  if (prefixM) {
    return prefixM[1].toUpperCase().charCodeAt(0) - 65
  }

  // Single uppercase/lowercase letter
  if (/^[A-Ha-h]$/.test(raw.trim())) {
    return raw.trim().toUpperCase().charCodeAt(0) - 65
  }

  // Single digit (1-based)
  if (/^\d+$/.test(raw.trim())) {
    return Math.max(0, parseInt(raw.trim()) - 1)
  }

  // Word answer (Verdadero, Falso, etc.)
  const n = normalize(raw)
  if (['verdadero', 'true', 'si', 'v', 'correcto', 'correct'].includes(n)) return 0
  if (['falso', 'false', 'no', 'f', 'incorrecto', 'incorrect'].includes(n)) return 1

  // Partial match against options text
  for (let i = 0; i < options.length; i++) {
    const on = normalize(options[i])
    if (on.startsWith(n.slice(0, 12)) || n.startsWith(on.slice(0, 12))) {
      return i
    }
  }

  return -1
}

// ── State machine ────────────────────────────────────────────────────────────

type State = 'INIT' | 'Q_TEXT' | 'OPTIONS' | 'Q_TF' | 'DONE'
type OptionStyle = 'letter' | 'number' | 'bullet' | null

interface CurrentQ {
  questionLines: string[]
  options: string[]
  correctIndex: number
  explanation: string
  isTF: boolean
  optionStyle: OptionStyle
  nextExpectedLetter: number  // for letter options: 0=A, 1=B, …
  nextExpectedNum: number     // for num options: next expected number
}

function freshQ(): CurrentQ {
  return {
    questionLines: [],
    options: [],
    correctIndex: -1,
    explanation: '',
    isTF: false,
    optionStyle: null,
    nextExpectedLetter: 0,
    nextExpectedNum: 1,
  }
}

function isTFOptions(opts: string[]): boolean {
  if (opts.length !== 2) return false
  const a = normalize(opts[0])
  const b = normalize(opts[1])
  const pairs = [['verdadero','falso'],['true','false'],['v','f'],['si','no'],['correcto','incorrecto']]
  return pairs.some(([t, f]) => (a===t&&b===f)||(a===f&&b===t))
}

function emitQ(q: CurrentQ): ParsedQuestion | null {
  const questionText = q.questionLines.join(' ').replace(/\s+/g, ' ').trim()
  if (!questionText || questionText.length < 3) return null

  if (q.isTF) {
    return {
      question: questionText,
      options: ['Verdadero', 'Falso'],
      correct_index: q.correctIndex,
      explanation: q.explanation,
      type: 'true_false',
    }
  }

  const validOpts = q.options.filter(o => o.trim().length > 0)
  if (validOpts.length < 2) return null

  if (isTFOptions(validOpts)) {
    return {
      question: questionText,
      options: ['Verdadero', 'Falso'],
      correct_index: q.correctIndex,
      explanation: q.explanation,
      type: 'true_false',
    }
  }

  return {
    question: questionText,
    options: validOpts.slice(0, 8),
    correct_index: q.correctIndex,
    explanation: q.explanation,
    type: 'single',
  }
}

export function parseQuestionsFromText(raw: string): ParsedQuestion[] {
  if (!raw.trim()) return []

  const allLines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const classified: LineInfo[] = allLines.map(classifyLine)

  const results: ParsedQuestion[] = []
  let state: State = 'INIT'
  let cur: CurrentQ = freshQ()

  // Helper: push result and reset
  const emit = () => {
    const q = emitQ(cur)
    if (q) results.push(q)
    cur = freshQ()
  }

  // Start a new question from a numbered_q or text line
  const startNewQ = (line: LineInfo) => {
    emit()
    if (line.kind === 'numbered_q') {
      if (textIsTFLabel(line.rest)) {
        cur.isTF = true
        state = 'Q_TF'
      } else {
        if (line.rest) cur.questionLines.push(line.rest)
        state = 'Q_TEXT'
      }
    } else if (line.kind === 'text') {
      cur.questionLines.push(line.text)
      state = 'Q_TEXT'
    } else if (line.kind === 'tf_label') {
      cur.isTF = true
      state = 'Q_TF'
    }
  }

  for (let i = 0; i < classified.length; i++) {
    const line = classified[i]

    // Skip empty lines everywhere
    if (line.kind === 'empty') continue

    // Lines to skip unconditionally (section headers like "Opciones:", "Preguntas:")
    if (line.kind === 'text' && /^(opciones|preguntas|alternativas|items?)\s*[:.]?\s*$/i.test(line.text)) continue

    switch (state) {

      // ── INIT ────────────────────────────────────────────────────────────────
      case 'INIT': {
        if (line.kind === 'numbered_q') {
          if (textIsTFLabel(line.rest)) {
            cur.isTF = true
            state = 'Q_TF'
          } else {
            if (line.rest) cur.questionLines.push(line.rest)
            state = 'Q_TEXT'
          }
        } else if (line.kind === 'tf_label') {
          cur.isTF = true
          state = 'Q_TF'
        } else if (line.kind === 'text') {
          cur.questionLines.push(line.text)
          state = 'Q_TEXT'
        }
        // letter_opt / num_opt / bullet_opt without a question: skip
        break
      }

      // ── Q_TEXT ──────────────────────────────────────────────────────────────
      case 'Q_TEXT': {
        if (line.kind === 'numbered_q') {
          if (textIsTFLabel(line.rest)) {
            emit()
            cur.isTF = true
            state = 'Q_TF'
          } else {
            // New numbered question starts — emit current
            startNewQ(line)
          }
        } else if (line.kind === 'tf_label') {
          // The accumulated question is a T/F question
          cur.isTF = true
          state = 'Q_TF'
        } else if (line.kind === 'letter_opt') {
          // First option encountered
          cur.options.push(line.text)
          cur.optionStyle = 'letter'
          cur.nextExpectedLetter = line.letter.charCodeAt(0) - 65 + 1
          state = 'OPTIONS'
        } else if (line.kind === 'num_opt') {
          // Could be numbered option — use lookahead to confirm
          const next = classified[i + 1]
          const followedByOpt = next && (
            next.kind === 'num_opt' || next.kind === 'letter_opt' || next.kind === 'bullet_opt'
          )
          if (followedByOpt || cur.questionLines.length > 0) {
            cur.options.push(line.text)
            cur.optionStyle = 'number'
            cur.nextExpectedNum = line.num + 1
            state = 'OPTIONS'
          } else {
            cur.questionLines.push(line.text)
          }
        } else if (line.kind === 'bullet_opt') {
          cur.options.push(line.text)
          cur.optionStyle = 'bullet'
          state = 'OPTIONS'
        } else if (line.kind === 'answer_key') {
          // Answer key with no options — if T/F resolve; otherwise ignore
          if (cur.isTF) {
            cur.correctIndex = resolveAnswer(line.raw, ['Verdadero', 'Falso'])
            emit()
            state = 'DONE'
          }
        } else if (line.kind === 'text') {
          cur.questionLines.push(line.text)
        }
        break
      }

      // ── OPTIONS ─────────────────────────────────────────────────────────────
      case 'OPTIONS': {
        if (line.kind === 'letter_opt') {
          cur.options.push(line.text)
          cur.nextExpectedLetter = line.letter.charCodeAt(0) - 65 + 1
        } else if (line.kind === 'num_opt') {
          if (cur.optionStyle === 'number' && line.num === cur.nextExpectedNum) {
            // Next expected number → continue as option
            cur.options.push(line.text)
            cur.nextExpectedNum = line.num + 1
          } else if (cur.options.length >= 4 || looksLikeQuestion(line.text)) {
            // Likely a new numbered question
            startNewQ(line)
          } else {
            // Ambiguous but fewer than 4 options — add as option
            cur.options.push(line.text)
            cur.nextExpectedNum = line.num + 1
          }
        } else if (line.kind === 'numbered_q') {
          // Numbered question line — new question starts
          startNewQ(line)
        } else if (line.kind === 'bullet_opt') {
          cur.options.push(line.text)
        } else if (line.kind === 'answer_key') {
          cur.correctIndex = resolveAnswer(line.raw, cur.options)
          emit()
          state = 'DONE'
        } else if (line.kind === 'tf_label') {
          // Unexpected after options — emit and start T/F
          emit()
          cur.isTF = true
          state = 'Q_TF'
        } else if (line.kind === 'text') {
          if (cur.options.length >= 4) {
            // Already have enough options; plain text = new question
            emit()
            cur.questionLines.push(line.text)
            state = 'Q_TEXT'
          } else if (cur.options.length >= 2) {
            // Lookahead: if next is an option or answer key, this might be a bare option
            const next = classified[i + 1]
            const nextIsOpt = next && (
              next.kind === 'letter_opt' || next.kind === 'num_opt' ||
              next.kind === 'bullet_opt' || next.kind === 'answer_key'
            )
            if (nextIsOpt && line.text.length < 150) {
              // Bare option without prefix
              cur.options.push(line.text)
            } else {
              // New question
              emit()
              cur.questionLines.push(line.text)
              state = 'Q_TEXT'
            }
          } else {
            // 0-1 options: treat as bare option
            cur.options.push(line.text)
          }
        }
        break
      }

      // ── Q_TF ────────────────────────────────────────────────────────────────
      case 'Q_TF': {
        if (line.kind === 'answer_key') {
          cur.correctIndex = resolveAnswer(line.raw, ['Verdadero', 'Falso'])
          emit()
          state = 'DONE'
        } else if (line.kind === 'text') {
          cur.questionLines.push(line.text)
        } else if (line.kind === 'numbered_q') {
          // T/F question ends, new question begins
          emit()
          if (textIsTFLabel(line.rest)) {
            cur.isTF = true
            state = 'Q_TF'
          } else {
            if (line.rest) cur.questionLines.push(line.rest)
            state = 'Q_TEXT'
          }
        } else if (line.kind === 'letter_opt') {
          // V/F expressed as A/B options → convert to options mode
          cur.options.push(line.text)
          cur.optionStyle = 'letter'
          state = 'OPTIONS'
        }
        break
      }

      // ── DONE (after answer key) ──────────────────────────────────────────────
      case 'DONE': {
        if (line.kind === 'numbered_q') {
          if (textIsTFLabel(line.rest)) {
            cur.isTF = true
            state = 'Q_TF'
          } else {
            if (line.rest) cur.questionLines.push(line.rest)
            state = 'Q_TEXT'
          }
        } else if (line.kind === 'tf_label') {
          cur.isTF = true
          state = 'Q_TF'
        } else if (line.kind === 'text') {
          cur.questionLines.push(line.text)
          state = 'Q_TEXT'
        } else if (line.kind === 'letter_opt') {
          // Options with no preceding question — start collecting
          cur.options.push(line.text)
          cur.optionStyle = 'letter'
          cur.nextExpectedLetter = line.letter.charCodeAt(0) - 65 + 1
          state = 'OPTIONS'
        }
        break
      }
    }
  }

  // Emit any trailing question
  const last = emitQ(cur)
  if (last) results.push(last)

  return results
}
