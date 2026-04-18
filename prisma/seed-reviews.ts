import { db } from "./seed-client";
import { DEFAULT_REVIEWS_FOR_SEED } from "../src/lib/reviews-default-data";

/** Добавляет отсутствующие отзывы (по паре steam + textEn). Не затирает правки в админке. */
async function main() {
  const maxRow = await db.review.aggregate({ _max: { sortOrder: true } });
  let nextOrder = (maxRow._max.sortOrder ?? -1) + 1;

  let created = 0;
  for (const r of DEFAULT_REVIEWS_FOR_SEED) {
    const exists = await db.review.findFirst({
      where: { steam: r.steam, textEn: r.en },
    });
    if (exists) continue;

    await db.review.create({
      data: {
        user: r.user,
        steam: r.steam,
        avatar: r.avatar,
        textEn: r.en,
        textRu: r.ru,
        game: r.game,
        stars: r.stars,
        isActive: true,
        sortOrder: nextOrder++,
      },
    });
    created++;
  }

  console.log(
    created > 0
      ? `Reviews: added ${created} new row(s); catalog total ${DEFAULT_REVIEWS_FOR_SEED.length} definitions.`
      : "Reviews: catalog already present (no new rows by steam+textEn).",
  );
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    db.$disconnect();
    process.exit(1);
  });
