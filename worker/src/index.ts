/**
 * KHSBHOF Chat API — Cloudflare Worker
 *
 * Handles POST /chat requests:
 *   1. Embed user query via Voyage AI
 *   2. Retrieve top-K relevant encyclopedia chunks from Supabase pgvector
 *   3. Build RAG prompt with retrieved context
 *   4. Stream Claude response back as SSE
 *
 * Environment secrets (set via `wrangler secret put`):
 *   ANTHROPIC_API_KEY, VOYAGE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, ALLOWED_ORIGIN
 */

export interface Env {
  ANTHROPIC_API_KEY: string
  VOYAGE_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  ALLOWED_ORIGIN: string
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message: string
  history?: ChatMessage[]
}

interface EncyclopediaChunk {
  id: number
  content: string
  metadata: Record<string, unknown>
  section: string | null
  category: string | null
  page_start: number | null
  page_end: number | null
  year_start: number | null
  year_end: number | null
  similarity: number
}

// ---------------------------------------------------------------------------
// System prompt — strict RAG grounding
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the official digital guide for the Kentucky High School Basketball Hall of Fame Encyclopedia — knowledgeable, warm, and conversational, like a Hall of Fame docent who has memorized every page.

CRITICAL RULES (never violate these):
1. You ONLY answer questions using information provided in the CONTEXT sections below.
2. If the context does not contain the answer, say clearly: "I don't have that specific information in the encyclopedia. You might find it by browsing the flipbook directly."
3. NEVER fabricate statistics, scores, names, dates, or any factual data. Zero tolerance for hallucination.
4. NEVER speculate or make inferences beyond what the context states.
5. If asked about something unrelated to Kentucky high school basketball history, politely redirect: "I'm specialized in Kentucky high school basketball history — happy to help with any questions about that!"

STYLE GUIDELINES:
- Be conversational and engaging, not robotic.
- Use specific details from the context (years, names, scores) to make answers vivid.
- For multi-turn conversations, remember what was discussed and refer back naturally.
- Keep responses concise but complete — aim for 2–4 paragraphs for detailed questions.
- If a page reference is available in the context metadata, optionally mention it: "According to page X of the encyclopedia..."

CONTENT SCOPE:
- Sweet 16 state championships (boys' and girls')
- Miss Basketball and Mister Basketball award winners
- Regional and district tournament results
- All-Tournament teams
- Hall of Fame inductee profiles
- All A Classic, Louisville Invitational, King of the Bluegrass
- Individual and team records, scoring leaders
- Coach of the Year records and coaching histories
- Players who went on to professional careers
- Black Athletic League history
- All-State teams, Litkenhous Ratings, Ted Sanford/Joe Billy Mansfield Award winners`

// ---------------------------------------------------------------------------
// Voyage AI embedding
// ---------------------------------------------------------------------------

async function embedQuery(query: string, apiKey: string): Promise<number[]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: [query],
      model: 'voyage-large-2',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Voyage AI embedding failed: ${res.status} — ${err}`)
  }

  const data = (await res.json()) as { data: Array<{ embedding: number[] }> }
  return data.data[0].embedding
}

// ---------------------------------------------------------------------------
// Supabase pgvector similarity search
// ---------------------------------------------------------------------------

async function searchChunks(
  embedding: number[],
  supabaseUrl: string,
  supabaseKey: string,
  matchCount = 8
): Promise<EncyclopediaChunk[]> {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/match_chunks`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      query_embedding: embedding,
      match_count: matchCount,
      similarity_threshold: 0.3,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase pgvector search failed: ${res.status} — ${err}`)
  }

  return (await res.json()) as EncyclopediaChunk[]
}

// ---------------------------------------------------------------------------
// Build RAG context string
// ---------------------------------------------------------------------------

function buildContext(chunks: EncyclopediaChunk[]): { contextText: string; sourceRef: string } {
  if (chunks.length === 0) {
    return { contextText: '', sourceRef: '' }
  }

  const sections = chunks.map((chunk, i) => {
    const ref = [
      chunk.section,
      chunk.page_start ? `p.${chunk.page_start}${chunk.page_end && chunk.page_end !== chunk.page_start ? `–${chunk.page_end}` : ''}` : null,
      chunk.year_start ? `(${chunk.year_start}${chunk.year_end && chunk.year_end !== chunk.year_start ? `–${chunk.year_end}` : ''})` : null,
    ]
      .filter(Boolean)
      .join(', ')

    return `[CONTEXT ${i + 1}${ref ? ` — ${ref}` : ''}]\n${chunk.content}`
  })

  const sourceRefs = chunks
    .map((c) =>
      [
        c.section,
        c.page_start ? `p.${c.page_start}` : null,
      ]
        .filter(Boolean)
        .join(' ')
    )
    .filter(Boolean)
    .slice(0, 3)
    .join('; ')

  return {
    contextText: sections.join('\n\n'),
    sourceRef: sourceRefs,
  }
}

// ---------------------------------------------------------------------------
// Stream Claude response
// ---------------------------------------------------------------------------

async function streamClaude(
  message: string,
  history: ChatMessage[],
  contextText: string,
  apiKey: string,
  controller: ReadableStreamDefaultController
): Promise<void> {
  const encoder = new TextEncoder()

  function send(data: object) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  // Build messages array with injected context
  const contextInjected = contextText
    ? `${message}\n\n---\n${contextText}`
    : message

  const messages: ChatMessage[] = [
    ...history.slice(-6), // Keep last 6 turns for context window
    { role: 'user', content: contextInjected },
  ]

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
      stream: true,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${res.status} — ${err}`)
  }

  if (!res.body) throw new Error('No response body from Claude')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const text = decoder.decode(value, { stream: true })
    const lines = text.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const event = JSON.parse(data) as {
            type: string
            delta?: { type: string; text?: string }
          }
          if (event.type === 'content_block_delta' && event.delta?.text) {
            send({ delta: event.delta.text })
          }
        } catch {
          // Skip malformed SSE events
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

function corsHeaders(origin: string, allowedOrigin: string) {
  const allowed =
    !allowedOrigin ||
    allowedOrigin === '*' ||
    origin === allowedOrigin ||
    origin.endsWith('.pages.dev')
      ? origin
      : allowedOrigin

  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('origin') ?? '*'
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN ?? '*')

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    // Only POST /chat
    const url = new URL(request.url)
    if (request.method !== 'POST' || url.pathname !== '/chat') {
      return new Response('Not found', { status: 404, headers: cors })
    }

    let body: ChatRequest
    try {
      body = (await request.json()) as ChatRequest
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const { message, history = [] } = body
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // Stream the response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        function sendError(msg: string) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
          )
        }

        try {
          // 1. Embed query
          const embedding = await embedQuery(message.trim(), env.VOYAGE_API_KEY)

          // 2. Retrieve relevant chunks
          const chunks = await searchChunks(
            embedding,
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_KEY
          )

          // 3. Build context
          const { contextText, sourceRef } = buildContext(chunks)

          // 4. Send source ref metadata as first SSE event
          if (sourceRef) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ source_ref: sourceRef })}\n\n`)
            )
          }

          // 5. Stream Claude
          await streamClaude(message.trim(), history, contextText, env.ANTHROPIC_API_KEY, controller)

          // 6. Done
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Internal server error'
          sendError(msg)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  },
}
