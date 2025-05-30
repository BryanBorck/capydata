import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ImageSelector from '../components/ImageSelector';

const IMAGE_OPTIONS = [
  'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9',
];

const PROMPT = 'Pick the picture you like the most';

interface Stats {
  points: number;
  lastCompleted: string | null; // ISO date string
}

const STORAGE_KEY = 'datagotchi-stats';

function loadStats(): Stats {
  if (typeof window === 'undefined') return { points: 0, lastCompleted: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { points: 0, lastCompleted: null };
    return JSON.parse(raw) as Stats;
  } catch {
    return { points: 0, lastCompleted: null };
  }
}

function saveStats(stats: Stats) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

type Mode = 'select' | 'image' | 'twitter';

const TwitterScraper = dynamic(() => import('../components/TwitterScraper'), { ssr: false });

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({ points: 0, lastCompleted: null });
  const [completedToday, setCompletedToday] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<Mode>('select');

  useEffect(() => {
    const s = loadStats();
    setStats(s);
    const today = new Date().toISOString().split('T')[0];
    setCompletedToday(s.lastCompleted === today);
  }, []);

  const awardPoint = () => {
    const today = new Date().toISOString().split('T')[0];

    if (!completedToday) {
      const newStats: Stats = {
        points: stats.points + 1,
        lastCompleted: today,
      };
      setStats(newStats);
      saveStats(newStats);
      setCompletedToday(true);
    }

    setSubmitted(true);
  };

  const handleImageSubmit = () => {
    awardPoint();
  };

  const handleTwitterSuccess = (_tweetText: string) => {
    awardPoint();
  };

  const resetSubmitted = () => setSubmitted(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-4">
      <div className="w-full max-w-md">
        {mode === 'select' && (
          <div className="flex flex-col gap-4">
            <button
              className="py-3 rounded-md bg-blue-600 text-white font-medium"
              onClick={() => setMode('image')}
            >
              Pick an Image
            </button>
            <button
              className="py-3 rounded-md bg-blue-600 text-white font-medium"
              onClick={() => setMode('twitter')}
            >
              Scrape a Twitter Post
            </button>
          </div>
        )}

        {mode === 'image' && !completedToday && !submitted && (
          <ImageSelector images={IMAGE_OPTIONS} prompt={PROMPT} onSubmit={handleImageSubmit} />
        )}

        {mode === 'twitter' && !completedToday && !submitted && (
          <>
            <button
              className="mb-4 text-sm text-blue-600 underline"
              onClick={() => setMode('select')}
            >
              ← Back
            </button>
            <TwitterScraper onSuccess={handleTwitterSuccess} />
          </>
        )}

        {submitted && (
          <div className="text-center mt-8 flex flex-col gap-4">
            <p className="text-lg font-semibold">Thanks for submitting!</p>
            <button
              onClick={resetSubmitted}
              className="py-2 px-4 bg-blue-600 text-white rounded-md"
            >
              Pick again
            </button>
          </div>
        )}
        {completedToday && !submitted && (
          <div className="text-center mt-8">
            <p className="text-lg font-semibold">You have completed today&apos;s prompt! 🎉</p>
            <p className="text-sm text-gray-600">Come back tomorrow for more points.</p>
          </div>
        )}
      </div>
    </main>
  );
} 