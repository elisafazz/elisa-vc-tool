import { NextResponse } from 'next/server'
import { generateSpaceQuestions, generateRefinedThesis } from '@/lib/claude'

export async function POST(req: Request) {
  const { name, description, answers } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  if (!answers) {
    // Step 1: generate clarifying questions
    const questions = await generateSpaceQuestions(name, description ?? '')
    return NextResponse.json({ questions })
  } else {
    // Step 2: generate refined thesis from Q&A
    const thesis = await generateRefinedThesis(name, description ?? '', answers)
    return NextResponse.json({ thesis })
  }
}
