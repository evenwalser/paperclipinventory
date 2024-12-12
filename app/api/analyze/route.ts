import { NextResponse } from 'next/server';
import { getCategoryStats } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryPath = searchParams.get('category');

  console.log('Analyzing category:', categoryPath);

  try {
    const stats = await getCategoryStats(categoryPath || '');
    console.log('Stats retrieved:', stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze data' }, { status: 500 });
  }
}