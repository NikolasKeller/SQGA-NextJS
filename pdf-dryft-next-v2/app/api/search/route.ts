import { NextRequest, NextResponse } from 'next/server'
import { getDirectAnswer } from '@/lib/textAnalysis'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    
    if (!data?.query || !data?.text) {
      return NextResponse.json(
        { error: 'Query und Text sind erforderlich' },
        { status: 400 }
      )
    }

    const result = getDirectAnswer(data.query, data.text)
    
    return NextResponse.json({
      query: data.query,
      results: result
    })
    
  } catch (error) {
    console.error('Suchfehler:', error)
    return NextResponse.json(
      { error: 'Suchfehler' },
      { status: 500 }
    )
  }
} 