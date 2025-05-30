import { useState, FormEvent } from 'react';

interface TwitterScraperProps {
  onSuccess: (tweetText: string) => void;
}

export default function TwitterScraper({ onSuccess }: TwitterScraperProps) {
  const [tweetUrl, setTweetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tweetUrl) return;
    setLoading(true);
    setError(null);
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'}/api/v1/scraper/scrape/twitter`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: tweetUrl, instruction: '' }),
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      // Assume data includes tweet text at data.data.text or similar; fallback to JSON stringify
      const text = (data?.data?.text ?? JSON.stringify(data));
      onSuccess(text);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md mx-auto">
      <label className="text-lg font-medium text-center">Paste a Twitter post URL</label>
      <input
        type="url"
        required
        placeholder="https://twitter.com/..."
        value={tweetUrl}
        onChange={(e) => setTweetUrl(e.target.value)}
        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="py-2 rounded-md bg-blue-600 text-white font-medium disabled:bg-gray-400"
      >
        {loading ? 'Scraping...' : 'Scrape'}
      </button>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </form>
  );
} 