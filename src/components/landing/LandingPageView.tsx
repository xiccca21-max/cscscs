"use client";

import { useEffect, useRef, useState, useMemo, type CSSProperties } from "react";
import { useTranslations, useLocale } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { ReviewsCarousel, type ReviewSlide } from "./ReviewsCarousel";

const PAYOUT_NAMES = [
  "Alex C.",
  "Maria S.",
  "Denis P.",
  "Oleg K.",
  "Anna M.",
  "Sergey L.",
];

/** Mostly under $500; rarely above $1000. */
function randAmount() {
  const r = Math.random();
  if (r < 0.72) return (15 + Math.random() * 485).toFixed(2);
  if (r < 0.92) return (500 + Math.random() * 500).toFixed(2);
  return (1000 + Math.random() * 280).toFixed(2);
}

export function LandingPageView() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const [faqOpen, setFaqOpen] = useState<string | null>(null);
  const payoutTick = useRef(0);
  const [rows, setRows] = useState([
    { name: "Alex C.", amount: "412.00" },
    { name: "Maria S.", amount: "89.50" },
    { name: "Denis P.", amount: "267.00" },
  ]);

  const reviewData = [
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
    { user: "alwaysbeingmad", steam: "https://steamcommunity.com/id/alwaysbeingmad", avatar: "https://avatars.akamai.steamstatic.com/6889e542266ff1eca9c32d7f405a723a0e19f756_full.jpg", en: "TF2 unusual sold without drama. Price was competitive and I didn't have to babysit the trade.", ru: "Unusual из TF2 продался без проблем. Цена конкурентная, не пришлось следить за трейдом.", game: "TF2", stars: 5 },
    { user: "мультиварка", steam: "https://steamcommunity.com/profiles/76561199483113949", avatar: "https://avatars.fastly.steamstatic.com/b16f280ed8855bb587f905123f16015b6acd5cbf_full.jpg", en: "Rust item sale was smooth; offer was upfront and payout didn't make me wait.", ru: "Продажа вещей из Rust прошла гладко; цена была честная, выплата не заставила ждать.", game: "Rust", stars: 5 },
    { user: "артём туберкулез", steam: "https://steamcommunity.com/profiles/76561199275399375", avatar: "https://avatars.akamai.steamstatic.com/627fe4b25ccb32470ffb155310dddd067d3a3c86_full.jpg", en: "CS2 knife out, cash in — exactly what I needed. Site feels modern and process is quick.", ru: "Нож из CS2 продан, деньги получены — именно то, что нужно. Сайт современный, процесс быстрый.", game: "CS2", stars: 5 },
    { user: "RIP | гнидыч", steam: "https://steamcommunity.com/profiles/76561199212382946", avatar: "https://avatars.akamai.steamstatic.com/f2286c3e658bef6c18b9c2ad5f3722fd38c4d9b4_full.jpg", en: "Dota courier sold at a price I was happy with. Support was responsive too.", ru: "Курьер из Доты продан по цене, которая устроила. Поддержка тоже отвечала быстро.", game: "Dota 2", stars: 5 },
    { user: "RKER", steam: "https://steamcommunity.com/profiles/76561199649161705", avatar: "https://avatars.fastly.steamstatic.com/9cf396a0da9cb87d7faefe58feeae7acf6e2b363_full.jpg", en: "Straightforward selling — no endless forms. Payout landed when they said it would.", ru: "Продажа без лишней волокиты — никаких бесконечных форм. Выплата пришла вовремя.", game: "CS2", stars: 5 },
    { user: "нн какой-то", steam: "https://steamcommunity.com/profiles/76561199172392618", avatar: "https://avatars.fastly.steamstatic.com/b2732234f3fbed341c241f58e1848418941f7d92_full.jpg", en: "Mixed Dota immortals with CS skins; both went fine. Good prices and fast turnaround.", ru: "Продавал иммортали из Доты и скины CS — всё прошло нормально. Хорошие цены и быстрая обработка.", game: "Dota 2", stars: 4 },
    { user: "Sh\\oomg?!", steam: "https://steamcommunity.com/id/sh_oomg", avatar: "https://avatars.akamai.steamstatic.com/30dcff5ce04a33d33c2d890c472291a39c74b0d7_full.jpg", en: "Rust skins aren't always easy to cash out — here it was painless and the offer beat my expectations.", ru: "Скины из Rust не всегда легко продать — здесь это было просто, и цена превзошла ожидания.", game: "Rust", stars: 5 },
    { user: "nehapau", steam: "https://steamcommunity.com/id/rubututu", avatar: "https://avatars.fastly.steamstatic.com/e35b436b2ad9ddf56deff6c7235bccc74ce96b6c_full.jpg", en: "Five stars for simplicity. Upload, confirm, get paid — that's it.", ru: "Пять звёзд за простоту. Загрузил, подтвердил, получил деньги — всё.", game: "CS2", stars: 5 },
    { user: "meSS", steam: "https://steamcommunity.com/id/MES4000", avatar: "https://avatars.fastly.steamstatic.com/feca7d42f8b1da251828346dc0c08f63582a1e35_full.jpg", en: "Good experience overall. Payout arrived quickly once the trade was accepted.", ru: "В целом хороший опыт. Выплата пришла быстро после принятия трейда.", game: "CS2", stars: 4 },
    { user: "Af1_piece", steam: "https://steamcommunity.com/id/Af1_piece", avatar: "https://avatars.fastly.steamstatic.com/ba7e49834e953d7a99982765049f3feecd4863ac_full.jpg", en: "CS inventory cleanup done right — sold a stack of skins in one session, rates were fair.", ru: "Почистил инвентарь CS как надо — продал пачку скинов за один раз, курсы были честные.", game: "CS2", stars: 5 },
    { user: "m8chnix", steam: "https://steamcommunity.com/id/m8chnix", avatar: "https://avatars.fastly.steamstatic.com/3f5e9daea59216d7fe13df4e031d3537580e5e21_full.jpg", en: "Dota sets moved fast. I like that I can see what I'm getting before I commit to sell.", ru: "Сеты из Доты ушли быстро. Нравится, что видно сумму до подтверждения продажи.", game: "Dota 2", stars: 5 },
    { user: "skins for your cases", steam: "https://steamcommunity.com/profiles/76561198358221005", avatar: "https://avatars.fastly.steamstatic.com/50767cea96889a121066ed45c098873cb258f8f3_full.jpg", en: "Steam trade went through cleanly and money followed shortly after. No stress.", ru: "Стим-трейд прошёл чисто, деньги пришли вскоре после. Без стресса.", game: "CS2", stars: 5 },
    { user: "POD_PIVASS", steam: "https://steamcommunity.com/profiles/76561199222494168", avatar: "https://avatars.fastly.steamstatic.com/a3ca986a183134fc94bf2d872e76a529bc3f71a0_full.jpg", en: "TF2 trading can be a mess — this was the opposite. Clear steps, quick payout.", ru: "Торговля в TF2 бывает тем ещё хаосом — тут всё наоборот. Понятные шаги, быстрая выплата.", game: "TF2", stars: 5 },
    { user: "deshumitsu", steam: "https://steamcommunity.com/id/deshumitsu", avatar: "https://avatars.akamai.steamstatic.com/ffcdcf5811d3d582ca9df3ff17c7008aa002c611_full.jpg", en: "Came back for a second time and the experience was just as smooth. Highly recommend.", ru: "Вернулся во второй раз — всё так же гладко. Очень рекомендую.", game: "CS2", stars: 5 },
    { user: "Sh\\oomg?!", steam: "https://steamcommunity.com/id/sh_oomg", avatar: "https://avatars.akamai.steamstatic.com/30dcff5ce04a33d33c2d890c472291a39c74b0d7_full.jpg", en: "Sold a bunch of Rust drops in one go. Quick process and fair pricing.", ru: "Продал кучу дропов из Rust за раз. Быстрый процесс и честные цены.", game: "Rust", stars: 4 },
  ];
  const reviewSlides: ReviewSlide[] = useMemo(
    () => reviewData.map((r) => ({ ...r, text: locale === "ru" ? r.ru : r.en })),
    [locale],
  );

  useEffect(() => {
    const root = document.querySelector(".sw-home");
    if (!root) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    root.querySelectorAll(".fade-up").forEach((el) => io.observe(el));

    const timeline = root.querySelector(".steps-timeline");
    const tIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            timeline?.classList.add("is-visible");
            tIo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.3 },
    );
    if (timeline) tIo.observe(timeline);

    const stack = root.querySelector(".card-stack");
    const section = stack?.closest(".games-section") ?? stack?.parentElement;
    const sIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) stack?.classList.add("card-stack--fanned");
        });
      },
      { threshold: 0.15 },
    );
    if (section) sIo.observe(section);

    const fGrid = root.querySelector(".features__grid");
    const fIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            fGrid?.classList.add("is-visible");
            fIo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    if (fGrid) fIo.observe(fGrid);

    return () => {
      io.disconnect();
      tIo.disconnect();
      sIo.disconnect();
      fIo.disconnect();
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const idx = payoutTick.current % 3;
      payoutTick.current += 1;
      const name = PAYOUT_NAMES[payoutTick.current % PAYOUT_NAMES.length];
      const amount = Number(randAmount()).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setRows((prev) => {
        const next = [...prev];
        next[idx] = { name, amount };
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const faqItems = [
    { id: "faq1", q: t("faq1q"), a: t("faq1a") },
    { id: "faq2", q: t("faq2q"), a: t("faq2a") },
    { id: "faq3", q: t("faq3q"), a: t("faq3a") },
    { id: "faq4", q: t("faq4q"), a: t("faq4a") },
    { id: "faq5", q: t("faq5q"), a: t("faq5a") },
  ] as const;
  const toggleFaq = (key: string) =>
    setFaqOpen((o) => (o === key ? null : key));

  return (
    <div className="sw-home">
      <section className="hero">
        <div className="hero__particles" aria-hidden>
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="hero__particle"
              style={
                {
                  "--x": `${10 + i * 11}%`,
                  "--y": `${15 + (i * 7) % 70}%`,
                  "--dur": `${16 + i * 2}s`,
                  "--dx": `${(i % 2 ? 1 : -1) * (40 + i * 10)}px`,
                  "--dy": `${-80 - i * 15}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="hero__inner container">
          <div className="hero__content">
            <div className="hero__live">
              <span className="hero__live-dot" />
              {t("heroLive")}
            </div>
            <h1 className="hero__title">
              <span className="hero__title-thin">{t("heroTitleThin")}</span>
              <span className="hero__title-bold">
                <span className="hero__title-gradient">{t("heroTitleGradient")}</span>
              </span>
            </h1>
            <p className="hero__sub">{t("heroSubtitle")}</p>
            <div className="hero__cta">
              <Link href="/sell" className="hero-btn hero-btn--primary">
                <span className="hero-btn__bg" />
                <span className="hero-btn__shimmer" />
                <span className="hero-btn__label">{t("heroCta")}</span>
                <svg className="hero-btn__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__stack">
              {[
                ["COVERT", "Factory New", "AK-47 | Case Hardened", "675.00", "712.50"],
                ["CLASSIFIED", "Minimal Wear", "AWP | Gungnir", "1,290.00", "1,380.00"],
                ["COVERT", "Field-Tested", "M4A4 | Howl", "1,850.00", "1,950.00"],
              ].map(([r, w, n, p, st], i) => (
                <div key={n} className="hero__card" style={{ "--i": i, "--color": "#eb4b4b" } as CSSProperties}>
                  <div className="hero__card-line" />
                  <div className="hero__card-meta">
                    <span className="hero__card-rarity">{r}</span>
                    <span className="hero__card-wear">{w}</span>
                  </div>
                  <div className="hero__card-preview">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.06">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="2" x2="12" y2="22" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                    </svg>
                  </div>
                  <p className="hero__card-name">{n}</p>
                  <div className="hero__card-bottom">
                    <span className="hero__card-price">{p}$</span>
                    <span className="hero__card-steam">{st}$</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hero__payouts">
              <div className="hero__payouts-header">
                <span className="hero__payouts-dot" />
                {t("recentPayouts")}
              </div>
              {rows.map((row, i) => (
                <div key={i} className="hero__payout-row">
                  <div className="hero__payout-user">
                    <span>{row.name.charAt(0)}</span> {row.name}
                  </div>
                  <span className="hero__payout-amount">{row.amount}$</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="hero__stats-bar">
          <div className="container hero__stats-inner">
            <span>
              <strong>15K+</strong> {t("statsSkins")}
            </span>
            <span className="hero__stats-dot">&bull;</span>
            <span>
              <strong>12K+</strong> {t("statsSellers")}
            </span>
            <span className="hero__stats-dot">&bull;</span>
            <span>
              <strong>4.87</strong> {t("statsRating")}
            </span>
          </div>
        </div>
      </section>

      <section className="steps-section" id="howItWorks">
        <div className="container">
          <h2 className="steps-section__title fade-up">
            {t("stepsTitle")} <span>{t("stepsTitleAccent")}</span>
          </h2>
          <p className="steps-section__sub fade-up">{t("stepsSub")}</p>
          <div className="steps-timeline">
            <div className="steps-timeline__line">
              <div className="steps-timeline__progress" />
            </div>
            {[
              {
                n: "01",
                title: t("step1Title"),
                desc: t("step1Desc"),
                cta: t("step1Cta"),
                href: "steam" as const,
              },
              {
                n: "02",
                title: t("step2Title"),
                desc: t("step2Desc"),
                cta: t("step2Cta"),
                href: "/sell" as const,
              },
              {
                n: "03",
                title: t("step3Title"),
                desc: t("step3Desc"),
                cta: t("step3Cta"),
                href: "/sell" as const,
              },
            ].map((step, i) => (
              <div key={step.n} className="step" data-step={i + 1} style={{ "--d": i } as CSSProperties}>
                <div className="step__dot">
                  <span>{step.n}</span>
                </div>
                <div className="step__card" data-num={step.n}>
                  <div className="step__icon">
                    {i === 0 && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                    )}
                    {i === 1 && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {i === 2 && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    )}
                  </div>
                  <div className="step__content">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                  {step.href === "steam" ? (
                    <form action="/api/auth/steam" method="get" className="contents">
                      <button type="submit" className="step__cta">
                        {step.cta}{" "}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </form>
                  ) : (
                    <Link href={step.href} className="step__cta">
                      {step.cta}{" "}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="games-section fade-up">
        <div className="container">
          <h2 className="section-title">
            {t("gamesTitle")} <span>{t("gamesTitleAccent")}</span>
          </h2>
          <p className="section-sub">{t("gamesSub")}</p>
          <div className="card-stack">
            {[
              { tag: "CS2", title: t("gameCs2"), desc: t("gameCs2Desc"), g1: "#e2740e", g2: "#c2590a", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/capsule_616x353.jpg" },
              { tag: "DOTA 2", title: t("gameDota"), desc: t("gameDotaDesc"), g1: "#dc2626", g2: "#b91c1c", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/570/capsule_616x353.jpg" },
              { tag: "TF2", title: t("gameTf2"), desc: t("gameTf2Desc"), g1: "#ca8a04", g2: "#a16207", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/440/capsule_616x353.jpg" },
              { tag: "RUST", title: t("gameRust"), desc: t("gameRustDesc"), g1: "#16a34a", g2: "#15803d", img: "https://cdn.cloudflare.steamstatic.com/steam/apps/252490/capsule_616x353.jpg" },
            ].map((g, i) => (
              <div
                key={g.tag}
                className="card-stack__card"
                style={
                  {
                    "--i": i,
                    "--g1": g.g1,
                    "--g2": g.g2,
                    "--bg-img": `url('${g.img}')`,
                  } as CSSProperties
                }
              >
                <span className="card-stack__tag">{g.tag}</span>
                <div className="card-stack__glass">
                  <h3>{g.title}</h3>
                  <p>{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="payouts-section fade-up">
        <div className="container">
          <h2 className="payouts-section__title">
            {t("payoutTitle")} <span>{t("payoutTitleAccent")}</span>
          </h2>
          <p className="payouts-section__sub">{t("payoutSub")}</p>
          <div className="payouts-grid">
            {[
              { pc: "#1A1F71", badge: t("payoutBadgeInstant"), h: t("payoutVisa"), p: t("payoutVisaDesc") },
              { pc: "#F7931A", badge: t("payoutBadge10m"), h: t("payoutBtc"), p: t("payoutBtcDesc") },
              { pc: "#26A17B", badge: t("payoutBadgeInstant"), h: t("payoutUsdt"), p: t("payoutUsdtDesc") },
              { pc: "#6366f1", badge: t("payoutBadge12d"), h: t("payoutBank"), p: t("payoutBankDesc") },
            ].map((c) => (
              <div key={c.h} className="payout-card" style={{ "--pc": c.pc } as CSSProperties}>
                <div className="payout-card__inner payout-card__front">
                  <span className="payout-card__badge">{c.badge}</span>
                  <h3>{c.h}</h3>
                  <p>{c.p}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="payouts-grid payouts-grid--row2">
            {[
              { pc: "#627eea", badge: "~5 min", h: "Ethereum (ERC-20)", p: "Fast on-chain ETH transfer" },
              { pc: "#26A17B", badge: t("payoutBadgeInstant"), h: "USDT (ERC-20)", p: "Stablecoin via Ethereum network" },
              { pc: "#bfbbbb", badge: "~10 min", h: "Litecoin (LTC)", p: "Low-fee crypto payments" },
              { pc: "#f59e0b", badge: t("payoutBadgeInstant"), h: "Balance", p: "Instant credit to your account" },
            ].map((c) => (
              <div key={c.h} className="payout-card" style={{ "--pc": c.pc } as CSSProperties}>
                <div className="payout-card__inner payout-card__front">
                  <span className="payout-card__badge">{c.badge}</span>
                  <h3>{c.h}</h3>
                  <p>{c.p}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="payouts-notice">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>
              <strong>{t("payoutNoticeStrong")}</strong> {t("payoutNotice")}
            </p>
          </div>
        </div>
      </section>

      <section className="reviews-section" id="reviews">
        <div className="container">
          <h2 className="section-title fade-up">
            {t("reviewsTitle")} <span>{t("reviewsTitleAccent")}</span>
          </h2>
          <p className="section-sub fade-up">{t("reviewsSub")}</p>
        </div>
        <ReviewsCarousel slides={reviewSlides} steamProfileLabel={t("steamProfile")} />
      </section>

      <section className="features" id="features">
        <div className="container">
          <h2 className="features__title fade-up">
            {t("featuresTitle")} <span>{t("featuresTitleAccent")}</span>
          </h2>
          <p className="features__sub fade-up">{t("featuresSub")}</p>
          <div className="features__grid">
            {[
              {
                stat: t("f1stat"),
                title: t("f1title"),
                desc: t("f1desc"),
                fi: 0,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
              },
              {
                stat: t("f2stat"),
                title: t("f2title"),
                desc: t("f2desc"),
                fi: 1,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ),
              },
              {
                stat: t("f3stat"),
                title: t("f3title"),
                desc: t("f3desc"),
                fi: 2,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                ),
              },
              {
                stat: t("f4stat"),
                title: t("f4title"),
                desc: t("f4desc"),
                fi: 3,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                ),
              },
              {
                stat: t("f5stat"),
                title: t("f5title"),
                desc: t("f5desc"),
                fi: 4,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                ),
              },
              {
                stat: t("f6stat"),
                title: t("f6title"),
                desc: t("f6desc"),
                fi: 5,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                ),
              },
            ].map((f) => (
              <div key={f.fi} className="feature-card" style={{ "--fi": f.fi } as CSSProperties}>
                <span className="feature-card__num">0{f.fi + 1}</span>
                <div className="feature-card__icon">{f.icon}</div>
                <span className="feature-card__stat">{f.stat}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="faq-preview" id="faq">
        <div className="container">
          <h2 className="section-title fade-up">
            {t("faqPreviewTitle")} <span>{t("faqPreviewAccent")}</span>
          </h2>
          <p className="section-sub fade-up">{t("faqPreviewSub")}</p>
          <div className="faq-list">
            {faqItems.slice(0, 4).map((item, i) => {
              const id = `pv-${item.id}`;
              const open = faqOpen === id;
              return (
                <div
                  key={item.id}
                  className={cn("faq-item", open && "open")}
                  style={{ "--fi": i } as CSSProperties}
                >
                  <button
                    type="button"
                    className="faq-item__q"
                    aria-expanded={open}
                    onClick={() => toggleFaq(id)}
                  >
                    <span className="faq-item__num">0{i + 1}</span>
                    <span>{item.q}</span>
                    <svg className="faq-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div className="faq-item__a">
                    <p>{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-16">
        <div className="container">
          <h2 className="section-title">{t("faqTitle")}</h2>
          <div className="mt-8 space-y-2">
            {faqItems.map((item, i) => {
              const id = `all-${item.id}`;
              const open = faqOpen === id;
              return (
                <div key={item.id} className={cn("faq-item rounded-xl border border-border bg-bg-card", open && "open")}>
                  <button
                    type="button"
                    className="faq-item__q !rounded-xl"
                    aria-expanded={open}
                    onClick={() => toggleFaq(id)}
                  >
                    <span className="faq-item__num">0{i + 1}</span>
                    <span>{item.q}</span>
                    <svg className="faq-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div className="faq-item__a">
                    <p>{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
