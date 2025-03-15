import { NextRequest, NextResponse } from 'next/server'
import { getAIResponse } from '@/lib/langchainUtils'

export async function POST(req: NextRequest) {
  try {
    const { query, context } = await req.json()
    
    if (!query || !context) {
      return NextResponse.json(
        { error: 'Query und Context sind erforderlich' },
        { status: 400 }
      )
    }

    const result = await getAIResponse(query, context)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ answer: result.answer })
    
  } catch (error) {
    console.error('AI-Anfragefehler:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
} 