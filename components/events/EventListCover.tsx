"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { eventImageUrl } from "@/lib/event-images";

/**
 * Cover art for a row in the /events list.
 *
 * Events without photos keep their category gradient. Events with photos get
 * a quiet crossfade between them and a row of white dots — no arrows, no
 * captions, and nothing for the stretched card link to compete with.
 */
export default function EventListCover({
  images,
  title,
  gradient,
  sizes = "(max-width: 640px) 100vw, 176px",
}: {
  images: string[];
  title: string;
  gradient: string;
  sizes?: string;
}) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const current = total > 0 ? Math.min(index, total - 1) : 0;

  useEffect(() => {
    if (total < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % total), 4500);
    return () => window.clearInterval(timer);
  }, [total]);

  return (
    <>
      {/* The gradient stays underneath, both as the no-photo cover and while
          the signed image requests are still loading. */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-300 group-hover:scale-105`}
      />

      {total > 0 && (
        <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105">
          {images.map((key, slide) => (
            <Image
              key={`${key}-${slide}`}
              src={eventImageUrl(key)}
              alt={slide === current ? `تصویر رویداد ${title}` : ""}
              fill
              unoptimized
              sizes={sizes}
              className={`object-cover transition-opacity duration-500 motion-reduce:transition-none ${
                slide === current ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      )}

      <div className="absolute inset-0 bg-black/15" />

      {total > 1 && (
        <div
          aria-hidden="true"
          className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1"
        >
          {images.map((key, slide) => (
            <span
              key={`dot-${key}-${slide}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                slide === current ? "w-4 bg-white shadow" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
