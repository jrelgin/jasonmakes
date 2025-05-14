import { fetchFeedly } from '../../../../../lib/providers/feedly';

export const runtime = 'edge';           // fast, no cold-start
export const revalidate = 0;             // always fresh

export async function GET() {
  try {
    const feedly = await fetchFeedly();
    return Response.json({ ok: true, feedly });
  } catch (err) {
    console.error('Debug feedly error →', err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
