// app/components/AboutBlurb.tsx
export const revalidate = 86_400; // 24 hours (daily refresh)

import { kv } from '../../../lib/kv';

export default async function AboutBlurb() {
  let blurb: string | null = null;
  
  try {
    // Fetch blurb from Vercel KV
    blurb = await kv.get<string>('blurb');
  } catch (error) {
    console.error('Failed to fetch blurb from KV:', error);
  }
  
  return (
    <div className="about-blurb my-6">
      <p className="prose max-w-xl text-xl italic text-gray-900 dark:text-gray-100 leading-relaxed">{blurb ?? 'Loading...'}</p>
    </div>
  );
}
