export interface ParsedQuestion {
  question: string
  options: string[]
  correct_index: number  // -1 = not selected yet
  explanation: string
  type: 'single' | 'true_false'
}

// Detect if a line is an option prefix (returns the clean option text, or null)
function extractOption(line: string): string | null {
  // A) / A. / a) / a. (letters)
  const letterOpt = line.match(/^[A-Fa-f][).\s]\s*(.+)/)
  if (letterOpt) return letterOpt[1].trim()
  // 1) / 1. (numbers up to 6)
  const numOpt = line.match(/^[1-6][).]\s*(.+)/)
  if (numOpt) return numOpt[1].trim()
  // • - * → (bullets/dashes)
  const bulletOpt = line.match(/^[•\-\*→▸]\s*(.+)/)
  if (bulletOpt) return bulletOpt[1].trim()
  return null
}

// True/False detection
function isTrueFalse(opts: string[]): boolean {
  if (opts.length !== 2) return false
  const a = opts[0].toLowerCase().trim()
  const b = opts[1].toLowerCase().trim()
  const tfPairs = [
    ['verdadero', 'falso'],
    ['true', 'false'],
    ['v', 'f'],
    ['sí', 'no'],
    ['si', 'no'],
    ['correcto', 'incorrecto'],
  ]
  return tfPairs.some(([t, f]) => (a === t && b === f) || (a === f && b === t))
}

// Strip leading question number (1. / 1) / Q1. etc.)
function stripLeadingNumber(text: string): string {
  return text.replace(/^(Q\d+|Pregunta\s*\d+|\d+)[).\s:]+\s*/i, '').trim()
}

export function parseQuestionsFromText(raw: string): ParsedQuestion[] {
  if (!raw.trim()) return []

  // Normalize line endings
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  // Split into blank-line-delimited blocks
  const blocks: string[][] = []
  let current: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (t === '') {
      if (current.length > 0) { blocks.push(current); current = [] }
    } else {
      current.push(t)
    }
  }
  if (current.length > 0) blocks.push(current)

  const questions: ParsedQuestion[] = []

  // Process each block
  // Strategy: within a block, the first line that is NOT an option line is the question text.
  // Lines that ARE option lines are the options.
  // A block may be: [question_line, opt1, opt2, opt3, opt4] (typical)
  // Or: [question_line] (question only, next block has options) — we'll try to merge
  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi]

    // Find split point: where options begin
    let splitIdx = block.length // assume all lines are question text
    for (let i = 0; i < block.length; i++) {
      if (extractOption(block[i]) !== null) {
        splitIdx = i
        break
      }
    }

    const questionLines = block.slice(0, splitIdx)
    let optionLines = block.slice(splitIdx)

    // If block has only question text and no options, peek at next block
    if (optionLines.length === 0 && bi + 1 < blocks.length) {
      const nextBlock = blocks[bi + 1]
      // Next block is all options if ALL lines in it are option-prefixed
      const allOpts = nextBlock.every(l => extractOption(l) !== null || isMaybeOptionWithoutPrefix(l, nextBlock))
      if (nextBlock.every(l => extractOption(l) !== null)) {
        optionLines = nextBlock
        bi++ // consume next block
      }
    }

    if (questionLines.length === 0) continue

    const questionText = stripLeadingNumber(questionLines.join(' ').replace(/\s+/g, ' '))
    if (!questionText || questionText.length < 5) continue

    const options = optionLines.map(l => extractOption(l) ?? l).filter(o => o.length > 0)

    // Need at least 2 options
    if (options.length < 2) {
      // Maybe it's a text-only question with no options — skip
      if (!questions.length || questionText !== questions[questions.length - 1].question) {
        // Still add it so user can see it and decide
      }
      continue
    }

    const tf = isTrueFalse(options)
    questions.push({
      question: questionText,
      options: tf ? ['Verdadero', 'Falso'] : options.slice(0, 8),
      correct_index: -1,
      explanation: '',
      type: tf ? 'true_false' : 'single',
    })
  }

  return questions
}

// Heuristic: a line might be an option without a letter prefix (bare text in a list context)
function isMaybeOptionWithoutPrefix(line: string, block: string[]): boolean {
  // If other lines in block have letter prefixes, this bare line is also an option
  const hasPrefix = block.some(l => extractOption(l) !== null)
  return hasPrefix && line.length < 120 && !line.endsWith('?')
}
