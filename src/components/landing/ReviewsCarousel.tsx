"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type ReviewSlide = {
  user: string;
  text: string;
  game: string;
  av1: string;
  av2: string;
};

const AUTO_MS = 5000;

function slideClass(i: number, current: number, total: number) {
  let offset = i - current;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  if (offset === 0) return "is-active";
  if (offset === -1) return "is-prev";
  if (offset === 1) return "is-next";
  if (offset === -2) return "is-far-prev";
  if (offset === 2) return "is-far-next";
  return "";
}

const Star = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export function ReviewsCarousel({
  slides,
  steamProfileLabel,
}: {
  slides: ReviewSlide[];
  steamProfileLabel: string;
}) {
  const total = slides.length;
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    if (!reduced && total > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % total);
      }, AUTO_MS);
    }
  }, [reduced, stop, total]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  const go = (idx: number) => {
    setCurrent(((idx % total) + total) % total);
    start();
  };

  if (total === 0) return null;

  return (
    <div
      className="carousel"
      aria-roledescription="carousel"
      aria-label="Reviews"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(current - 1);
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(current + 1);
        }
      }}
      onMouseEnter={stop}
      onMouseLeave={start}
    >
      <div className="carousel__viewport">
        {slides.map((s, i) => (
          <div
            key={s.user}
            className={cn("carousel__slide", slideClass(i, current, total))}
            onClick={() => i !== current && go(i)}
            role="group"
            aria-roledescription="slide"
          >
            <div
              className="review-card"
              style={
                { "--av1": s.av1, "--av2": s.av2 } as React.CSSProperties
              }
            >
              <span className="review-card__quote">&ldquo;</span>
              <div className="review-card__header">
                <div className="review-card__avatar">
                  <span>{s.user.charAt(0).toUpperCase()}</span>
                </div>
                <div className="review-card__user">
                  <span className="review-card__name">{s.user}</span>
                  <div className="review-card__stars" aria-label="5 stars">
                    <Star />
                    <Star />
                    <Star />
                    <Star />
                    <Star />
                  </div>
                </div>
              </div>
              <p className="review-card__text">{s.text}</p>
              <div className="review-card__footer">
                <span className="review-card__game">{s.game}</span>
                <span className="review-card__steam-btn">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  {steamProfileLabel}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="carousel__arrow carousel__arrow--prev"
        aria-label="Previous"
        onClick={() => go(current - 1)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        type="button"
        className="carousel__arrow carousel__arrow--next"
        aria-label="Next"
        onClick={() => go(current + 1)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div className="carousel__dots" role="tablist" aria-label="Reviews">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className={cn("carousel__dot", i === current && "active")}
            role="tab"
            aria-label={`Review ${i + 1}`}
            aria-selected={i === current}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
