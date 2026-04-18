"use client";

import { useState, useEffect } from "react";

export type PublicReviewCard = {
  user: string;
  steam: string;
  avatar: string;
  en: string;
  ru: string;
  game: string;
  stars: number;
};

/** Отзывы с `GET /api/reviews` (активные из БД). Пока `loading === true`, список ещё не загружен. */
export function usePublicReviews(locale: string): {
  reviews: PublicReviewCard[];
  loading: boolean;
} {
  const [reviews, setReviews] = useState<PublicReviewCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/reviews?locale=${encodeURIComponent(locale)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.success && Array.isArray(d.data)) {
          setReviews(
            d.data.map(
              (row: {
                user: string;
                steam: string;
                avatar: string;
                textEn: string;
                textRu: string;
                game: string;
                stars: number;
              }) => ({
                user: row.user,
                steam: row.steam,
                avatar: row.avatar ?? "",
                en: row.textEn ?? "",
                ru: row.textRu ?? "",
                game: row.game ?? "CS2",
                stars: row.stars ?? 5,
              }),
            ),
          );
        } else {
          setReviews([]);
        }
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return { reviews, loading };
}
