import { fetchWeather } from '../../../../../lib/providers/weather';

export const runtime = 'edge';           // fast, no cold-start
export const revalidate = 0;             // always fresh

export async function GET() {
  try {
    const weather = await fetchWeather();
    return Response.json({ ok: true, weather });
  } catch (err) {
    console.error('Debug weather error →', err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
