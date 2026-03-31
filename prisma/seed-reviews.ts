import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/cs_ne_go",
});
const db = new PrismaClient({ adapter });

const reviews = [
  { user: "Donation / Trash Bot", steam: "https://steamcommunity.com/id/DonationTrashBot", avatar: "https://avatars.fastly.steamstatic.com/408cf6038cdf995d3ed371ed5c629825020a4496_full.jpg", en: "Listed a few surplus items and the whole flow took minutes. Payout hit my wallet faster than I expected.", ru: "Выставил пару лишних предметов — весь процесс занял минуты. Деньги пришли быстрее, чем я ожидал.", game: "CS2", stars: 5 },
  { user: "Дырка", steam: "https://steamcommunity.com/id/nZarr", avatar: "https://avatars.fastly.steamstatic.com/b7fbf78e6d2abb73de19ff818cf221d1264cca7f_full.jpg", en: "Quick payout, love it! Super easy to list skins.", ru: "Быстрая выплата, кайф! Очень легко выставить скины на продажу.", game: "CS2", stars: 5 },
  { user: "ÜberTowelie", steam: "https://steamcommunity.com/id/ubrtwelie", avatar: "https://avatars.fastly.steamstatic.com/9784f13db7219632d3a7c3f49d7176ca44f9043f_full.jpg", en: "Sold my knife here after comparing a few sites — best offer and zero hassle.", ru: "Продал нож тут после сравнения нескольких сайтов — лучшее предложение и ноль проблем.", game: "CS2", stars: 5 },
  { user: "ВАТНЫЙ БИОСКОТ", steam: "https://steamcommunity.com/profiles/76561198215365185", avatar: "https://avatars.fastly.steamstatic.com/600a54e62405d2696730eabca74233adfd9aea7e_full.jpg", en: "Prices aligned with what I saw on trackers. Payout speed is the main reason I keep coming back.", ru: "Цены совпадают с трекерами. Скорость выплаты — главная причина, почему возвращаюсь.", game: "Dota 2", stars: 5 },
  { user: "Отпрaвил(a) Опapыши", steam: "https://steamcommunity.com/id/amnyam_mode", avatar: "https://avatars.fastly.steamstatic.com/e12d99edc700e71d2802de3b8b1803602c83a335_full.jpg", en: "Interface is clean and I didn't have to dig through menus. Cashout was smooth.", ru: "Интерфейс чистый, не пришлось копаться в меню. Вывод прошёл гладко.", game: "CS2", stars: 4 },
  { user: "Hotojour", steam: "https://steamcommunity.com/id/hotojour", avatar: "https://avatars.fastly.steamstatic.com/fac095ae5500bd538b6f5ce0f4f111c29e3c9d40_full.jpg", en: "First time selling skins online and it was straightforward from login to payout. Good prices.", ru: "Первый раз продавал скины онлайн — всё просто от входа до выплаты. Хорошие цены.", game: "Dota 2", stars: 5 },
  { user: "deshumitsu", steam: "https://steamcommunity.com/id/deshumitsu", avatar: "https://avatars.akamai.steamstatic.com/ffcdcf5811d3d582ca9df3ff17c7008aa002c611_full.jpg", en: "Traded out some Dota arcanas. Speed was great — order cleared and I had funds the same evening.", ru: "Продал несколько арканок из Доты. Скорость отличная — ордер закрылся, и деньги пришли в тот же вечер.", game: "Dota 2", stars: 5 },
  { user: "✪ ON", steam: "https://steamcommunity.com/profiles/76561198089414875", avatar: "https://avatars.akamai.steamstatic.com/267e59a7196d17a131750595c9dbfde764156c77_full.jpg", en: "Easy for bulk selling — listed several items and didn't get lost in the UI.", ru: "Удобно для массовой продажи — выставил сразу несколько предметов и не запутался.", game: "CS2", stars: 5 },
  { user: "SalehiTakhasomi-", steam: "https://steamcommunity.com/profiles/76561198070671099", avatar: "https://avatars.fastly.steamstatic.com/caf2ad22ed4dee920e36d81c4028ccebbea8990e_full.jpg", en: "TF2 hats: sold a couple, both trades completed fast. Would recommend.", ru: "Шапки TF2: продал пару, обе сделки прошли быстро. Рекомендую.", game: "TF2", stars: 4 },
  { user: "киберпсих", steam: "https://steamcommunity.com/id/lilxant", avatar: "https://avatars.fastly.steamstatic.com/99224e78e560e32386229204eb36efb9f48d2635_full.jpg", en: "Reliable for high-tier CS skins. Support answered my question quickly too.", ru: "Надёжный сервис для дорогих скинов CS. Поддержка тоже ответила быстро.", game: "CS2", stars: 5 },
  { user: "kerfmit", steam: "https://steamcommunity.com/id/kerfmit", avatar: "https://avatars.akamai.steamstatic.com/83dc1a5c8069efed85d7d5ce4276ed4c107e8899_full.jpg", en: "Payout came through without chasing anyone. Ease of use is top tier.", ru: "Выплата пришла без всяких напоминаний. Удобство на высшем уровне.", game: "CS2", stars: 5 },
  { user: "Vikk", steam: "https://steamcommunity.com/id/vikk01", avatar: "https://avatars.fastly.steamstatic.com/4cbedfb67439252048d73a4a89b691d7d92f8258_full.jpg", en: "Solid rates on gloves. Everything felt transparent; no surprises when the sale completed.", ru: "Хорошие цены на перчатки. Всё прозрачно, никаких сюрпризов при завершении сделки.", game: "CS2", stars: 4 },
  { user: "Silense", steam: "https://steamcommunity.com/id/SilenseMS", avatar: "https://avatars.fastly.steamstatic.com/ff78ef467e72dacca0175d569ae8d3e3cf6696e2_full.jpg", en: "Been using this for a while. Consistent speed, good liquidity, prices track the market well.", ru: "Пользуюсь уже давно. Стабильная скорость, хорошая ликвидность, цены следят за рынком.", game: "CS2", stars: 5 },
  { user: "Про Ватан", steam: "https://steamcommunity.com/id/ProVatan", avatar: "https://avatars.fastly.steamstatic.com/3fdb613788603ab0841cbdeaae20feaa2fd9cec9_full.jpg", en: "Quick sale on a mid-tier rifle skin. Site is easy to navigate and the payout didn't drag.", ru: "Быстрая продажа среднего скина на винтовку. Сайт удобный, выплата не затянулась.", game: "CS2", stars: 5 },
  { user: "ЛЕРАUNDERПИВКО", steam: "https://steamcommunity.com/id/TheTanyaVonDegurechaff", avatar: "https://avatars.fastly.steamstatic.com/9592cd883362e6350af2e91a62d8219b87c3676d_full.jpg", en: "Long review short: I trust this place more than random Discord buyers. Fair quote, fast settlement.", ru: "Коротко: доверяю этому сервису больше, чем рандомным покупателям в дискорде. Честная цена, быстрый расчёт.", game: "Dota 2", stars: 5 },
];

async function main() {
  const count = await db.review.count();
  if (count > 0) {
    console.log(`Skipped: ${count} reviews already exist.`);
    return;
  }
  console.log("Seeding reviews...");
  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
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
        sortOrder: i,
      },
    });
  }
  console.log(`Done: ${reviews.length} reviews created.`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    db.$disconnect();
    process.exit(1);
  });
