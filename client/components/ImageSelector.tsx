import Image from 'next/image';
import { useState } from 'react';

export interface ImageSelectorProps {
  images: string[];
  prompt: string;
  onSubmit: (selectedIndex: number) => void;
}

export default function ImageSelector({ images, prompt, onSubmit }: ImageSelectorProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selected !== null) {
      onSubmit(selected);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-center px-4">{prompt}</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {images.map((src, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelected(idx)}
            className={`relative aspect-square overflow-hidden rounded-lg focus:outline-none ring-4 transition-all duration-150 ${
              selected === idx ? 'ring-blue-500' : 'ring-transparent'
            }`}
          >
            <Image src={src} alt={`option-${idx}`} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="mt-2 py-3 rounded-md bg-blue-600 text-white font-medium disabled:bg-gray-400"
      >
        Submit
      </button>
    </div>
  );
} 