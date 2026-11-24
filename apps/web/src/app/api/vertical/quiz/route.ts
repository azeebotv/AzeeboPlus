import { NextResponse } from 'next/server';
import { getVerticalDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const verticalDb = getVerticalDb();
    const quiz = await verticalDb.agbalaQuiz.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!quiz) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    const questions =
      (quiz.questions as Array<{
        id: string;
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
      }>) || [];

    return NextResponse.json({
      success: true,
      data: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        questions,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query agbala quiz';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
