import { fetchReadwise } from "../../../../../lib/providers/readwise";

export const runtime = "edge";
export const revalidate = 0;

export async function GET() {
  try {
    const reading = await fetchReadwise();
    return Response.json({ ok: true, reading });
  } catch (err) {
    console.error("Debug readwise error:", err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
