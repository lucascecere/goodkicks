import { drawQuiz } from '@/lib/townies/quiz';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ questions: drawQuiz() }, { headers: { 'Cache-Control': 'no-store' } });
}
