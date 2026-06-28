// Gemini Flash client
// Strict system prompt: answers ONLY from uploaded documents
// Supports text + vision (handwritten docs, images)

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

const SYSTEM_PROMPT = `You are ExaminerAI, a professional legal knowledge assistant for Sri Lanka Motor Traffic Department examiners.

STRICT RULES — follow every rule below without exception, in every response:

RULE 1 — DOCUMENTS ONLY:
Answer ONLY using information explicitly found in the provided KNOWLEDGE BASE documents.
Do NOT use any outside knowledge, training data, internet information, or general world knowledge — even if you are certain of the answer.

RULE 2 — NOT FOUND RESPONSE:
If the answer is not found in the provided documents, respond with exactly this and nothing else:
"I couldn't find that in your uploaded documents. Please upload the relevant gazette, act, or report."
Do not guess, estimate, or partially answer using outside knowledge.

RULE 3 — MANDATORY SOURCE BLOCK:
Every answer MUST end with a SOURCE BLOCK in this exact format — no exceptions:

━━━━━━━━━━━━━━━━━━━━
📄 SOURCE DETAILS
━━━━━━━━━━━━━━━━━━━━
Document  : [exact file name as uploaded]
Category  : [document category]
Act / Regulation : [Act name and number if present, e.g. "Motor Traffic Act No. 14 of 1951"]
Gazette No.      : [Gazette number if present, e.g. "2356/12" — write "N/A" if not applicable]
Section / Clause : [exact section, clause, or article number cited, e.g. "Section 42(3)" — write "N/A" if not a legal document]
Page / Sheet     : [page number or sheet name if identifiable — write "N/A" if unknown]
━━━━━━━━━━━━━━━━━━━━

RULE 4 — MULTIPLE SOURCES:
If the answer references more than one document, repeat the full SOURCE BLOCK once for each document.

RULE 5 — PRECISION:
Quote exact section numbers, clause numbers, article numbers, regulation numbers, and gazette numbers exactly as they appear in the document. Do not paraphrase or approximate legal references.

RULE 6 — PROFESSIONAL FORMAT:
Structure every answer clearly:
- State the direct answer first
- Then provide supporting details, sub-sections, or conditions
- Then the SOURCE BLOCK(s) at the end

RULE 7 — NO INVENTION:
Never invent, infer, assume, or extrapolate any information not explicitly written in the documents. If a specific detail such as an act number is not visible in the document, write "Not stated in document" for that field.

RULE 8 — LEGAL ACCURACY:
These answers may be used in official legal and court proceedings. Accuracy is mandatory. When in doubt, write "Not stated in document" rather than guessing.`

/**
 * Send a chat message to Gemini with document context
 */
export async function askGemini({
  question,
  brainContext,
  imageDocuments = [],
  conversationHistory = [],
  attachedFileText = null,
  attachedFileImage = null,
}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  console.log('[Gemini] API key present:', !!apiKey, '| starts with AIza:', apiKey?.startsWith('AIza'))
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    throw new Error('API_KEY_MISSING')
  }

  // Build system instruction text
  let systemText = SYSTEM_PROMPT
  if (brainContext) {
    systemText += `\n\n${brainContext}`
  } else {
    systemText += '\n\nNo documents have been uploaded yet. Tell the user to upload documents first.'
  }

  // Build the current user message parts
  const userParts = []

  // Main question text
  let questionText = `USER QUESTION: ${question}`
  if (attachedFileText) {
    questionText += `\n\n[ATTACHED FILE CONTENT]\n${attachedFileText}`
  }
  userParts.push({ text: questionText })

  // Attached image (handwritten doc attached to this specific message)
  if (attachedFileImage) {
    userParts.push({
      inline_data: {
        mime_type: attachedFileImage.mimeType,
        data: attachedFileImage.base64,
      }
    })
    userParts.push({ text: 'Please extract all text from the above image and use it to answer the question.' })
  }

  // Image documents from knowledge base (vision)
  for (const imgDoc of imageDocuments.slice(0, 3)) {
    userParts.push({
      inline_data: { mime_type: imgDoc.mimeType, data: imgDoc.base64 }
    })
  }

  // Build strictly alternating contents array
  const contents = []

  // Filter history to ensure strict user/model alternation
  const history = conversationHistory.slice(-6)
  let expectedRole = 'user'
  for (const msg of history) {
    const role = msg.role === 'assistant' ? 'model' : 'user'
    if (role !== expectedRole) continue
    if (!msg.text || msg.text.trim() === '') continue
    contents.push({ role, parts: [{ text: msg.text }] })
    expectedRole = role === 'user' ? 'model' : 'user'
  }

  // If last history item was 'user', clear to avoid conflict
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents.length = 0
  }

  // Add current user message
  contents.push({ role: 'user', parts: userParts })

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemText }]
    },
    contents,
    generationConfig: {
      temperature: 0.1,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  }

  console.log('[Gemini] Sending request with', contents.length, 'message(s)')

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = err.error?.message || 'GEMINI_ERROR'
    console.error('[Gemini] Error:', response.status, msg)
    if (response.status === 429) throw new Error('RATE_LIMIT')
    if (response.status === 403) throw new Error('INVALID_API_KEY: ' + msg)
    throw new Error('HTTP_' + response.status + ': ' + msg)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    console.error('[Gemini] Empty response:', JSON.stringify(data))
    throw new Error('EMPTY_RESPONSE')
  }
  return text
}
