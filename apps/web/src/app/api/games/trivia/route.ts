import { NextResponse } from 'next/server';
import { getGamesDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const gamesDb = getGamesDb();
    const questions = await gamesDb.question.findMany({
      orderBy: { order: 'asc' },
      take: 20,
    });

    const formatted = questions.map((q, idx) => {
      let optionsArray: string[] = [];
      if (Array.isArray(q.options)) {
        optionsArray = q.options as string[];
      } else if (typeof q.options === 'string') {
        try {
          optionsArray = JSON.parse(q.options);
        } catch {
          optionsArray = [];
        }
      }

      return {
        id: idx + 1,
        question: q.question,
        options: optionsArray.length > 0 ? optionsArray : [q.answer],
        correct: q.answer,
        points: q.points,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        questions: formatted,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query trivia questions';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
