import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    google: !!process.env.GOOGLE_API_KEY,
  });
}
