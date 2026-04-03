"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useCurrency } from "@/components/currency-provider";

const PAYOUT_NAMES = [
  "hokage", "Wa1halla", "РЫБАК", "kukas", "pinkgose",
  "G7AX", "Conq3r", "anger", "Razrez", "NoT1cE",
  "maestro", "max1moff_", "Nugaev", "Nomad", "Matt",
  "zxcLOVE", "dR_phiL", "Tr1ple", "FANTOM", "sh4rk",
  "icecoLd", "BiBa", "Sn1per_X", "volchok", "ДЕМОН",
  "kroshka", "T0xic", "freez", "Gl1tch", "sobaka228",
  "cr4zy_", "ВЕЗУНЧИК", "fl0wer", "D1kiy", "xNova",
  "sneg0vik", "БАРСУК", "ch1ef", "r3kt", "SULTAN",
  "pixeL_", "кот_учёный", "Bl4ze", "zefir", "ГРОЗА",
  "sw1ft", "l1ght", "ШТУРМ", "chill_guy", "pr0xy",
  "t0aster", "ВЕТЕР", "h4cker", "sk1ll", "МОЛНИЯ",
  "n1ce_one", "ТАЙФУН", "dr1ft", "echo_", "КОБРА",
  "v1per_", "СКАЛА", "s0lar", "byte_me", "ЛАВИНА",
  "qu4ntum", "ПЛАМЯ", "gr1nd", "sh1ft_", "КОМЕТА",
  "xtr3me", "ВИХРЬ", "cl0ud9", "sp4rk_", "ТИТАН",
  "n0mercy", "БУРАН", "ph4ntom", "r1der_", "ГЕПАРД",
  "z3n1th", "ИСКРА", "bl1tz_", "cr0ss", "ШТОРМ",
  "d4wn_", "ИМПУЛЬС", "fr0st", "gl0w_", "ОРИОН",
  "k1ng_", "РАКЕТА", "m1nder", "sp0t_", "СОКОЛ",
  "wr4th_", "ЭФИР", "turb0", "v0rtex", "ПРИЗРАК",
  "ax10m", "МЕТЕОР", "cy8er", "j0ker_", "СТРЕЛА",
  "p1xel", "РАССВЕТ", "q_tip", "st0rm_", "УРАГАН",
  "d3lta_", "ОГОНЬ", "thr1ve", "zenith", "ЯКОРЬ",
];

const REVIEWS: { user: string; steam: string; avatar: string; en: string; ru: string; game: string; stars: number }[] = [
  { user: "Donation / Trash Bot", steam: "https://steamcommunity.com/id/DonationTrashBot", avatar: "https://avatars.fastly.steamstatic.com/408cf6038cdf995d3ed371ed5c629825020a4496_full.jpg", en: "Listed a few surplus items and the whole flow took minutes. Payout hit my wallet faster than I expected.", ru: "Выставил пару лишних предметов - весь процесс занял минуты. Деньги пришли быстрее, чем я ожидал.", game: "CS2", stars: 5 },
  { user: "Дырка", steam: "https://steamcommunity.com/id/nZarr", avatar: "https://avatars.fastly.steamstatic.com/b7fbf78e6d2abb73de19ff818cf221d1264cca7f_full.jpg", en: "Quick payout, love it! Super easy to list skins.", ru: "Быстрая выплата, кайф! Очень легко выставить скины на продажу.", game: "CS2", stars: 5 },
  { user: "ÜberTowelie", steam: "https://steamcommunity.com/id/ubrtwelie", avatar: "https://avatars.fastly.steamstatic.com/9784f13db7219632d3a7c3f49d7176ca44f9043f_full.jpg", en: "Sold my knife here after comparing a few sites - best offer and zero hassle.", ru: "Продал нож тут после сравнения нескольких сайтов - лучшее предложение и ноль проблем.", game: "CS2", stars: 5 },
  { user: "ВАТНЫЙ БИОСКОТ", steam: "https://steamcommunity.com/profiles/76561198215365185", avatar: "https://avatars.fastly.steamstatic.com/600a54e62405d2696730eabca74233adfd9aea7e_full.jpg", en: "Prices aligned with what I saw on trackers. Payout speed is the main reason I keep coming back.", ru: "Цены совпадают с трекерами. Скорость выплаты - главная причина, почему возвращаюсь.", game: "Dota 2", stars: 5 },
  { user: "Отпрaвил(a) Опapыши", steam: "https://steamcommunity.com/id/amnyam_mode", avatar: "https://avatars.fastly.steamstatic.com/e12d99edc700e71d2802de3b8b1803602c83a335_full.jpg", en: "Interface is clean and I didn't have to dig through menus. Cashout was smooth.", ru: "Интерфейс чистый, не пришлось копаться в меню. Вывод прошёл гладко.", game: "CS2", stars: 4 },
  { user: "Hotojour", steam: "https://steamcommunity.com/id/hotojour", avatar: "https://avatars.fastly.steamstatic.com/fac095ae5500bd538b6f5ce0f4f111c29e3c9d40_full.jpg", en: "First time selling skins online and it was straightforward from login to payout. Good prices.", ru: "Первый раз продавал скины онлайн - всё просто от входа до выплаты. Хорошие цены.", game: "Dota 2", stars: 5 },
  { user: "deshumitsu", steam: "https://steamcommunity.com/id/deshumitsu", avatar: "https://avatars.akamai.steamstatic.com/ffcdcf5811d3d582ca9df3ff17c7008aa002c611_full.jpg", en: "Traded out some Dota arcanas. Speed was great - order cleared and I had funds the same evening.", ru: "Продал несколько арканок из Доты. Скорость отличная - ордер закрылся, и деньги пришли в тот же вечер.", game: "Dota 2", stars: 5 },
  { user: "✪ ON", steam: "https://steamcommunity.com/profiles/76561198089414875", avatar: "https://avatars.akamai.steamstatic.com/267e59a7196d17a131750595c9dbfde764156c77_full.jpg", en: "Easy for bulk selling - listed several items and didn't get lost in the UI.", ru: "Удобно для массовой продажи - выставил сразу несколько предметов и не запутался.", game: "CS2", stars: 5 },
  { user: "SalehiTakhasomi-", steam: "https://steamcommunity.com/profiles/76561198070671099", avatar: "https://avatars.fastly.steamstatic.com/caf2ad22ed4dee920e36d81c4028ccebbea8990e_full.jpg", en: "TF2 hats: sold a couple, both trades completed fast. Would recommend.", ru: "Шапки TF2: продал пару, обе сделки прошли быстро. Рекомендую.", game: "TF2", stars: 4 },
  { user: "киберпсих", steam: "https://steamcommunity.com/id/lilxant", avatar: "https://avatars.fastly.steamstatic.com/99224e78e560e32386229204eb36efb9f48d2635_full.jpg", en: "Reliable for high-tier CS skins. Support answered my question quickly too.", ru: "Надёжный сервис для дорогих скинов CS. Поддержка тоже ответила быстро.", game: "CS2", stars: 5 },
  { user: "kerfmit", steam: "https://steamcommunity.com/id/kerfmit", avatar: "https://avatars.akamai.steamstatic.com/83dc1a5c8069efed85d7d5ce4276ed4c107e8899_full.jpg", en: "Payout came through without chasing anyone. Ease of use is top tier.", ru: "Выплата пришла без всяких напоминаний. Удобство на высшем уровне.", game: "CS2", stars: 5 },
  { user: "Vikk", steam: "https://steamcommunity.com/id/vikk01", avatar: "https://avatars.fastly.steamstatic.com/4cbedfb67439252048d73a4a89b691d7d92f8258_full.jpg", en: "Solid rates on gloves. Everything felt transparent; no surprises when the sale completed.", ru: "Хорошие цены на перчатки. Всё прозрачно, никаких сюрпризов при завершении сделки.", game: "CS2", stars: 4 },
  { user: "Silense", steam: "https://steamcommunity.com/id/SilenseMS", avatar: "https://avatars.fastly.steamstatic.com/ff78ef467e72dacca0175d569ae8d3e3cf6696e2_full.jpg", en: "Been using this for a while. Consistent speed, good liquidity, prices track the market well.", ru: "Пользуюсь уже давно. Стабильная скорость, хорошая ликвидность, цены следят за рынком.", game: "CS2", stars: 5 },
  { user: "Про Ватан", steam: "https://steamcommunity.com/id/ProVatan", avatar: "https://avatars.fastly.steamstatic.com/3fdb613788603ab0841cbdeaae20feaa2fd9cec9_full.jpg", en: "Quick sale on a mid-tier rifle skin. Site is easy to navigate and the payout didn't drag.", ru: "Быстрая продажа среднего скина на винтовку. Сайт удобный, выплата не затянулась.", game: "CS2", stars: 5 },
  { user: "ЛЕРАUNDERПИВКО", steam: "https://steamcommunity.com/id/TheTanyaVonDegurechaff", avatar: "https://avatars.fastly.steamstatic.com/9592cd883362e6350af2e91a62d8219b87c3676d_full.jpg", en: "Long review short: I trust this place more than random buyers. Fair quote, fast settlement.", ru: "Коротко: доверяю этому сервису больше, чем рандомным покупателям. Честная цена, быстрый расчёт.", game: "Dota 2", stars: 5 },
  { user: "alwaysbeingmad", steam: "https://steamcommunity.com/id/alwaysbeingmad", avatar: "https://avatars.akamai.steamstatic.com/6889e542266ff1eca9c32d7f405a723a0e19f756_full.jpg", en: "TF2 unusual sold without drama. Price was competitive and I didn't have to babysit the trade.", ru: "Unusual из TF2 продался без проблем. Цена конкурентная, не пришлось следить за трейдом.", game: "TF2", stars: 5 },
  { user: "мультиварка", steam: "https://steamcommunity.com/profiles/76561199483113949", avatar: "https://avatars.fastly.steamstatic.com/b16f280ed8855bb587f905123f16015b6acd5cbf_full.jpg", en: "Rust item sale was smooth; offer was upfront and payout didn't make me wait.", ru: "Продажа вещей из Rust прошла гладко; цена была честная, выплата не заставила ждать.", game: "Rust", stars: 5 },
  { user: "артём туберкулез", steam: "https://steamcommunity.com/profiles/76561199275399375", avatar: "https://avatars.akamai.steamstatic.com/627fe4b25ccb32470ffb155310dddd067d3a3c86_full.jpg", en: "CS2 knife out, cash in - exactly what I needed. Site feels modern and process is quick.", ru: "Нож из CS2 продан, деньги получены - именно то, что нужно. Сайт современный, процесс быстрый.", game: "CS2", stars: 5 },
  { user: "RIP | гнидыч", steam: "https://steamcommunity.com/profiles/76561199212382946", avatar: "https://avatars.akamai.steamstatic.com/f2286c3e658bef6c18b9c2ad5f3722fd38c4d9b4_full.jpg", en: "Dota courier sold at a price I was happy with. Support was responsive too.", ru: "Курьер из Доты продан по цене, которая устроила. Поддержка тоже отвечала быстро.", game: "Dota 2", stars: 5 },
  { user: "RKER", steam: "https://steamcommunity.com/profiles/76561199649161705", avatar: "https://avatars.fastly.steamstatic.com/9cf396a0da9cb87d7faefe58feeae7acf6e2b363_full.jpg", en: "Straightforward selling - no endless forms. Payout landed when they said it would.", ru: "Продажа без лишней волокиты - никаких бесконечных форм. Выплата пришла вовремя.", game: "CS2", stars: 5 },
  { user: "нн какой-то", steam: "https://steamcommunity.com/profiles/76561199172392618", avatar: "https://avatars.fastly.steamstatic.com/b2732234f3fbed341c241f58e1848418941f7d92_full.jpg", en: "Mixed Dota immortals with CS skins; both went fine. Good prices and fast turnaround.", ru: "Продавал иммортали из Доты и скины CS - всё прошло нормально. Хорошие цены и быстрая обработка.", game: "Dota 2", stars: 4 },
  { user: "Sh\\oomg?!", steam: "https://steamcommunity.com/id/sh_oomg", avatar: "https://avatars.akamai.steamstatic.com/30dcff5ce04a33d33c2d890c472291a39c74b0d7_full.jpg", en: "Rust skins aren't always easy to cash out - here it was painless and the offer beat my expectations.", ru: "Скины из Rust не всегда легко продать - здесь это было просто, и цена превзошла ожидания.", game: "Rust", stars: 5 },
  { user: "nehapau", steam: "https://steamcommunity.com/id/rubututu", avatar: "https://avatars.fastly.steamstatic.com/e35b436b2ad9ddf56deff6c7235bccc74ce96b6c_full.jpg", en: "Five stars for simplicity. Upload, confirm, get paid - that's it.", ru: "Пять звёзд за простоту. Загрузил, подтвердил, получил деньги - всё.", game: "CS2", stars: 5 },
  { user: "meSS", steam: "https://steamcommunity.com/id/MES4000", avatar: "https://avatars.fastly.steamstatic.com/feca7d42f8b1da251828346dc0c08f63582a1e35_full.jpg", en: "Good experience overall. Payout arrived quickly once the trade was accepted.", ru: "В целом хороший опыт. Выплата пришла быстро после принятия трейда.", game: "CS2", stars: 4 },
  { user: "Af1_piece", steam: "https://steamcommunity.com/id/Af1_piece", avatar: "https://avatars.fastly.steamstatic.com/ba7e49834e953d7a99982765049f3feecd4863ac_full.jpg", en: "CS inventory cleanup done right - sold a stack of skins in one session, rates were fair.", ru: "Почистил инвентарь CS как надо - продал пачку скинов за один раз, курсы были честные.", game: "CS2", stars: 5 },
  { user: "m8chnix", steam: "https://steamcommunity.com/id/m8chnix", avatar: "https://avatars.fastly.steamstatic.com/3f5e9daea59216d7fe13df4e031d3537580e5e21_full.jpg", en: "Dota sets moved fast. I like that I can see what I'm getting before I commit to sell.", ru: "Сеты из Доты ушли быстро. Нравится, что видно сумму до подтверждения продажи.", game: "Dota 2", stars: 5 },
  { user: "skins for your cases", steam: "https://steamcommunity.com/profiles/76561198358221005", avatar: "https://avatars.fastly.steamstatic.com/50767cea96889a121066ed45c098873cb258f8f3_full.jpg", en: "Steam trade went through cleanly and money followed shortly after. No stress.", ru: "Стим-трейд прошёл чисто, деньги пришли вскоре после. Без стресса.", game: "CS2", stars: 5 },
  { user: "POD_PIVASS", steam: "https://steamcommunity.com/profiles/76561199222494168", avatar: "https://avatars.fastly.steamstatic.com/a3ca986a183134fc94bf2d872e76a529bc3f71a0_full.jpg", en: "TF2 trading can be a mess - this was the opposite. Clear steps, quick payout.", ru: "Торговля в TF2 бывает тем ещё хаосом - тут всё наоборот. Понятные шаги, быстрая выплата.", game: "TF2", stars: 5 },
  { user: "deshumitsu", steam: "https://steamcommunity.com/id/deshumitsu", avatar: "https://avatars.akamai.steamstatic.com/ffcdcf5811d3d582ca9df3ff17c7008aa002c611_full.jpg", en: "Came back for a second time and the experience was just as smooth. Highly recommend.", ru: "Вернулся во второй раз - всё так же гладко. Очень рекомендую.", game: "CS2", stars: 5 },
  { user: "Sh\\oomg?!", steam: "https://steamcommunity.com/id/sh_oomg", avatar: "https://avatars.akamai.steamstatic.com/30dcff5ce04a33d33c2d890c472291a39c74b0d7_full.jpg", en: "Sold a bunch of Rust drops in one go. Quick process and fair pricing.", ru: "Продал кучу дропов из Rust за раз. Быстрый процесс и честные цены.", game: "Rust", stars: 4 },
];

const SLIDE_COUNT = REVIEWS.length;

/** Mostly under $500; rarely above $1000 (trust display). */
function randomPayoutAmountUsd(): number {
  const r = Math.random();
  if (r < 0.72) return 15 + Math.random() * 485;
  if (r < 0.92) return 500 + Math.random() * 500;
  return 1000 + Math.random() * 280;
}

type PaymentMethodDB = {
  id: string;
  name: string;
  type: string;
  commission: string;
  minAmount: string;
  currencies: string[];
};

const FALLBACK_METHODS: PaymentMethodDB[] = [
  { id: "fb-balance",    name: "Balance",            type: "balance",    commission: "0",   minAmount: "0",  currencies: ["USD"] },
  { id: "fb-card",       name: "Visa / Mastercard",  type: "card",       commission: "2.5", minAmount: "1",  currencies: ["USD"] },
  { id: "fb-paypal",     name: "PayPal",             type: "paypal",     commission: "2.5", minAmount: "1",  currencies: ["USD", "EUR", "RUB"] },
  { id: "fb-alipay",     name: "Alipay",             type: "alipay",     commission: "2.5", minAmount: "1",  currencies: ["USD", "EUR", "CNY", "HKD"] },
  { id: "fb-btc",        name: "Bitcoin (BTC)",       type: "btc",        commission: "1",   minAmount: "10", currencies: ["USD"] },
  { id: "fb-usdt-trc20", name: "USDT (TRC-20)",      type: "usdt-trc20", commission: "0",   minAmount: "5",  currencies: ["USD"] },
  { id: "fb-eth",        name: "Ethereum (ERC-20)",   type: "eth",        commission: "1",   minAmount: "10", currencies: ["USD"] },
  { id: "fb-usdt-erc20", name: "USDT (ERC-20)",      type: "usdt-erc20", commission: "1",   minAmount: "10", currencies: ["USD"] },
  { id: "fb-ltc",        name: "Litecoin (LTC)",      type: "ltc",        commission: "1",   minAmount: "5",  currencies: ["USD"] },
  { id: "fb-bank",       name: "Bank / Банк",         type: "bank",       commission: "3",   minAmount: "50", currencies: ["USD"] },
];

const PAYOUT_CARD_COLORS: Record<string, string> = {
  balance:      "#f59e0b",
  card:         "#1A1F71",
  paypal:       "#0070ba",
  alipay:       "#1677FF",
  crypto:       "#F7931A",
  btc:          "#F7931A",
  "usdt-trc20": "#26A17B",
  "usdt-erc20": "#26A17B",
  eth:          "#627eea",
  ltc:          "#bfbbbb",
  bank:         "#6366f1",
  sbp:          "#1d4ed8",
  qiwi:         "#9333ea",
  yoomoney:     "#8b22c7",
  other:        "#6366f1",
};

function PayoutCardIcon({ type }: { type: string }) {
  switch (type) {
    case "card":
      return (
        <>
          <svg width="40" height="28" viewBox="0 0 48 32"><rect width="48" height="32" rx="4" fill="#1A1F71" /><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="1">VISA</text></svg>
          <svg width="40" height="28" viewBox="0 0 48 32"><rect width="48" height="32" rx="4" fill="#EB001B" opacity="0" /><circle cx="18" cy="16" r="10" fill="#EB001B" /><circle cx="30" cy="16" r="10" fill="#F79E1B" /><path d="M24 8.6a10 10 0 0 1 3.7 7.4A10 10 0 0 1 24 23.4 10 10 0 0 1 20.3 16 10 10 0 0 1 24 8.6z" fill="#FF5F00" /></svg>
        </>
      );
    case "paypal":
      return (
        <img
          src="/icons/pay-paypal.svg"
          alt=""
          width={88}
          height={36}
          className="payout-card__logo-img payout-card__logo-img--paypal"
        />
      );
    case "alipay":
      return (
        <img
          src="/icons/pay-alipay.svg"
          alt=""
          width={88}
          height={36}
          className="payout-card__logo-img payout-card__logo-img--alipay"
        />
      );
    case "crypto":
    case "btc":
      return (
        <svg width="44" height="44" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#F7931A" /><path d="M22.5 14c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.6 2.6c-.4-.1-.9-.2-1.3-.3l.7-2.6-1.7-.4-.7 2.7c-.4-.1-.7-.2-1-.2v-.1l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 .1.1.1.1.1h-.1l-1.2 4.7c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.7.4.7-2.8c2.8.5 5 .3 5.9-2.2.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.6zm-3.7 5.2c-.5 2.1-4.1 1-5.3.7l1-3.8c1.1.3 4.9.8 4.3 3.1zm.5-5.3c-.5 1.9-3.5.9-4.4.7l.8-3.4c1 .2 4.1.7 3.6 2.7z" fill="#fff" /></svg>
      );
    case "usdt-trc20":
    case "usdt-erc20":
      return (
        <svg width="44" height="44" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#26A17B" /><path d="M17.9 17.2v0c-.1 0-.7.1-2 .1-1 0-1.7 0-1.9-.1v0c-3.8-.2-6.6-.8-6.6-1.6s2.8-1.5 6.6-1.6v2.6c.3 0 1 .1 2 .1 1.2 0 1.8-.1 1.9-.1v-2.6c3.8.2 6.6.8 6.6 1.6s-2.8 1.4-6.6 1.6zm0-3.5V11h5.3V8H8.9v3h5.3v2.7c-4.3.2-7.5 1.1-7.5 2.1s3.2 1.9 7.5 2.1v7.6h3.7v-7.6c4.3-.2 7.5-1.1 7.5-2.1s-3.2-1.9-7.5-2.1z" fill="#fff" /></svg>
      );
    case "eth":
      return (
        <svg width="44" height="44" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#627eea"/><path d="M16.5 4v8.87l7.5 3.35L16.5 4z" fill="#fff" opacity=".6"/><path d="M16.5 4L9 16.22l7.5-3.35V4z" fill="#fff"/><path d="M16.5 21.97v6.03L24 17.62l-7.5 4.35z" fill="#fff" opacity=".6"/><path d="M16.5 28V21.97L9 17.62 16.5 28z" fill="#fff"/><path d="M16.5 20.57l7.5-4.35-7.5-3.35v7.7z" fill="#fff" opacity=".2"/><path d="M9 16.22l7.5 4.35v-7.7L9 16.22z" fill="#fff" opacity=".6"/></svg>
      );
    case "ltc":
      return (
        <svg width="44" height="44" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#bfbbbb"/><path d="M16 5l-1 .4v14.2l1 .6 7-4.1L16 5z" fill="#fff" opacity=".5"/><path d="M16 5L9 16.1l7 4.1V5z" fill="#fff"/><path d="M16 21.5l-.1.1v5.4l.1.3 7-9.8-7 4z" fill="#fff" opacity=".5"/><path d="M16 27.3v-5.8L9 17.5l7 9.8z" fill="#fff"/></svg>
      );
    case "bank":
      return (
        <svg width="44" height="44" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#6366f1" /><path d="M8 12h16M8 16h12M8 20h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><rect x="20" y="18" width="5" height="4" rx="1" fill="#fff" opacity="0.7" /></svg>
      );
    case "balance":
      return (
        <svg width="44" height="44" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#f59e0b"/><path d="M21 12a5 5 0 01-5 5h-3v5h-2V7h5a5 5 0 015 5z" fill="#fff"/><path d="M13 17h4a4 4 0 010 8h-4v-8z" fill="#fff" opacity=".7"/></svg>
      );
    case "sbp":
      return (
        <svg width="44" height="44" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#1d4ed8" /><path d="M10 8l6 8-6 8M16 16h6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      );
    default:
      return (
        <svg width="44" height="44" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#6366f1" /><circle cx="16" cy="16" r="6" fill="none" stroke="#fff" strokeWidth="2" /><path d="M16 13v6M13 16h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
      );
  }
}

export default function HomePage() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const { format, symbol } = useCurrency();

  const [homePaymentMethods, setHomePaymentMethods] = useState<PaymentMethodDB[]>([]);

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setHomePaymentMethods(json.data);
      })
      .catch(() => {});
  }, []);

  /** Методы из API; при отсутствии PayPal / Alipay в БД подмешиваем карточки (как на /sell). */
  const payoutMethodsForGrid = useMemo(() => {
    if (homePaymentMethods.length === 0) return FALLBACK_METHODS;
    let out = [...homePaymentMethods];
    if (!out.some((m) => m.type === "paypal")) {
      const paypalPm: PaymentMethodDB = {
        id: "ui-paypal",
        name: "PayPal",
        type: "paypal",
        commission: "2.5",
        minAmount: "1",
        currencies: ["USD", "EUR", "RUB"],
      };
      const afterCard = out.findIndex((m) => m.type === "card");
      if (afterCard >= 0) out.splice(afterCard + 1, 0, paypalPm);
      else out.unshift(paypalPm);
    }
    if (!out.some((m) => m.type === "alipay")) {
      const alipayPm: PaymentMethodDB = {
        id: "ui-alipay",
        name: "Alipay",
        type: "alipay",
        commission: "2.5",
        minAmount: "1",
        currencies: ["USD", "EUR", "CNY", "HKD"],
      };
      const paypalIdx = out.findIndex((m) => m.type === "paypal");
      if (paypalIdx >= 0) out.splice(paypalIdx + 1, 0, alipayPm);
      else {
        const afterCard = out.findIndex((m) => m.type === "card");
        if (afterCard >= 0) out.splice(afterCard + 1, 0, alipayPm);
        else out.unshift(alipayPm);
      }
    }
    return out;
  }, [homePaymentMethods]);

  /* ── A) Payout rotation ── */
  const payoutIdxRef = useRef(0);
  const payoutRowRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null, null, null]);
  const usedNamesRef = useRef<Set<string>>(new Set(["Wa1halla", "kukas", "G7AX", "РЫБАК", "Tr1ple", "pinkgose"]));

  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    const id = setInterval(() => {
      const idx = payoutIdxRef.current;
      const row = payoutRowRefs.current[idx];
      if (row) {
        row.style.opacity = "0";
        row.style.transform = "translateY(-8px)";
        setTimeout(() => {
          let name: string;
          const available = PAYOUT_NAMES.filter((n) => !usedNamesRef.current.has(n));
          if (available.length > 0) {
            name = available[Math.floor(Math.random() * available.length)];
          } else {
            usedNamesRef.current.clear();
            name = PAYOUT_NAMES[Math.floor(Math.random() * PAYOUT_NAMES.length)];
          }
          const oldName = row.querySelector(".hero__payout-user")?.textContent?.trim();
          if (oldName) usedNamesRef.current.delete(oldName);
          usedNamesRef.current.add(name);
          const amountUsd = randomPayoutAmountUsd();
          const userEl = row.querySelector(".hero__payout-user");
          const amountEl = row.querySelector(".hero__payout-amount");
          if (userEl) userEl.innerHTML = `<span>${name[0]}</span> ${name}`;
          if (amountEl) amountEl.textContent = formatRef.current(amountUsd);
          row.style.opacity = "1";
          row.style.transform = "translateY(0)";
        }, 300);
      }
      payoutIdxRef.current = (idx + 1) % 6;
    }, 3500);
    return () => clearInterval(id);
  }, []);

  /* ── B) Reviews carousel ── */
  const [liveReviews, setLiveReviews] = useState<typeof REVIEWS | null>(null);
  useEffect(() => {
    fetch(`/api/reviews?locale=${locale}`).then((r) => r.json()).then((d) => {
      if (d?.data?.length) {
        setLiveReviews(d.data.map((r: any) => ({ user: r.user, steam: r.steam, avatar: r.avatar, en: r.textEn, ru: r.textRu, game: r.game, stars: r.stars })));
      }
    }).catch(() => {});
  }, [locale]);
  const reviewData = liveReviews ?? REVIEWS;
  const slideCount = reviewData.length;

  const [current, setCurrent] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartX = useRef(0);
  const dragging = useRef(false);

  const stopAuto = useCallback(() => {
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    autoRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slideCount);
    }, 5000);
  }, [stopAuto, slideCount]);

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [startAuto, stopAuto]);

  const goPrev = () => setCurrent((c) => (c - 1 + slideCount) % slideCount);
  const goNext = () => setCurrent((c) => (c + 1) % slideCount);

  const getSlideClass = (index: number) => {
    const diff = ((index - current) % slideCount + slideCount) % slideCount;
    if (diff === 0) return "is-active";
    if (diff === 1) return "is-next";
    if (diff === slideCount - 1) return "is-prev";
    if (diff === 2) return "is-far-next";
    if (diff === slideCount - 2) return "is-far-prev";
    return "";
  };

  const handleDragStart = (clientX: number) => {
    dragging.current = true;
    dragStartX.current = clientX;
  };

  const handleDragEnd = (clientX: number) => {
    if (!dragging.current) return;
    dragging.current = false;
    const diff = clientX - dragStartX.current;
    if (diff > 50) goPrev();
    else if (diff < -50) goNext();
  };

  /* ── C) FAQ accordion ── */
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const toggleFaq = (idx: number) => setOpenFaqIdx((prev) => (prev === idx ? null : idx));

  /* ── D) Scroll reveal ── */
  useEffect(() => {
    const init = () => {
      const els = document.querySelectorAll(".fade-up");
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      els.forEach((el) => obs.observe(el));
      return obs;
    };
    const raf = requestAnimationFrame(() => { obsRef = init(); });
    let obsRef: IntersectionObserver | null = null;
    return () => { cancelAnimationFrame(raf); obsRef?.disconnect(); };
  }, []);

  /* ── E) Card stack fan ── */
  useEffect(() => {
    let obs: IntersectionObserver | null = null;
    const raf = requestAnimationFrame(() => {
      const section = document.querySelector(".games-section");
      const stack = document.querySelector(".card-stack");
      if (!section || !stack) return;
      obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stack.classList.add("card-stack--fanned");
            obs!.unobserve(section);
          }
        });
      }, { threshold: 0.15 });
      obs.observe(section);
    });
    return () => { cancelAnimationFrame(raf); obs?.disconnect(); };
  }, []);

  /* ── F) Steps timeline ── */
  useEffect(() => {
    let obs: IntersectionObserver | null = null;
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(".steps-timeline");
      if (!el) return;
      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) el.classList.add("is-visible");
          });
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
    });
    return () => { cancelAnimationFrame(raf); obs?.disconnect(); };
  }, []);

  /* ── G) Features grid stagger ── */
  useEffect(() => {
    let obs: IntersectionObserver | null = null;
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(".features__grid");
      if (!el) return;
      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) el.classList.add("is-visible");
          });
        },
        { threshold: 0.1 }
      );
      obs.observe(el);
    });
    return () => { cancelAnimationFrame(raf); obs?.disconnect(); };
  }, []);

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero__particles">
          <span className="hero__particle" style={{"--x":"10%","--y":"20%","--sz":"3px","--o":"0.25","--dur":"18s","--dx":"60px","--dy":"-100px"} as React.CSSProperties} />
          <span className="hero__particle" style={{"--x":"25%","--y":"70%","--sz":"2px","--o":"0.2","--dur":"22s","--dx":"-40px","--dy":"-80px"} as React.CSSProperties} />
          <span className="hero__particle" style={{"--x":"50%","--y":"15%","--sz":"4px","--o":"0.15","--dur":"25s","--dx":"30px","--dy":"90px"} as React.CSSProperties} />
          <span className="hero__particle" style={{"--x":"70%","--y":"60%","--sz":"2px","--o":"0.3","--dur":"20s","--dx":"-70px","--dy":"-60px"} as React.CSSProperties} />
          <span className="hero__particle" style={{"--x":"85%","--y":"30%","--sz":"3px","--o":"0.2","--dur":"16s","--dx":"50px","--dy":"70px"} as React.CSSProperties} />
          <span className="hero__particle" style={{"--x":"40%","--y":"85%","--sz":"2px","--o":"0.15","--dur":"24s","--dx":"-30px","--dy":"-120px"} as React.CSSProperties} />
          <span className="hero__particle" style={{"--x":"60%","--y":"40%","--sz":"3px","--o":"0.25","--dur":"19s","--dx":"80px","--dy":"-40px"} as React.CSSProperties} />
          <span className="hero__particle" style={{"--x":"15%","--y":"50%","--sz":"2px","--o":"0.2","--dur":"21s","--dx":"40px","--dy":"60px"} as React.CSSProperties} />
        </div>
        <div className="hero__inner container">
          <div className="hero__content">
            <h1 className="hero__title">
              <span className="hero__title-thin">{t("heroTitleThin")}</span>
              <span className="hero__title-bold"><span className="hero__title-gradient">{t("heroTitleGradient")}</span></span>
          </h1>
            <p className="hero__sub">
              {t("heroSubtitle")}
            </p>
            <div className="hero__cta">
              <Link href="/sell" className="hero-btn hero-btn--primary">
                <span className="hero-btn__bg"></span>
                <span className="hero-btn__shimmer"></span>
                <span className="hero-btn__label">{t("heroCta")}</span>
                <svg className="hero-btn__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </Link>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__stack">
              <div className="hero__card" style={{"--i":0,"--color":"#eb4b4b"} as React.CSSProperties}>
                <div className="hero__card-line"></div>
                <div className="hero__card-meta">
                  <span className="hero__card-rarity">COVERT</span>
                  <span className="hero__card-wear">Factory New</span>
                </div>
                <div className="hero__card-preview">
                  <img src="https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhhwszHeDFH6OO6nYeDg7mtYbiJkjoDvcAlj7yVotmtjAfjrkpoZW36IoaWclM3MFnY8lK9k-vnm9bi67lSw9Es" alt="AK-47 | Case Hardened" loading="lazy" style={{width:"100%",height:"100%",objectFit:"contain"}} />
                </div>
                <p className="hero__card-name">AK-47 | Case Hardened</p>
                <div className="hero__card-bottom">
                  <span className="hero__card-price">{format(675)}</span>
                </div>
              </div>
              <div className="hero__card" style={{"--i":1,"--color":"#d32ce6"} as React.CSSProperties}>
                <div className="hero__card-line"></div>
                <div className="hero__card-meta">
                  <span className="hero__card-rarity">COVERT</span>
                  <span className="hero__card-wear">Minimal Wear</span>
                </div>
                <div className="hero__card-preview">
                  <img src="https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FABz7PLfYQJF-dKxmomZqPv9NLPF2G0JuMYj0ryYodzz3wG3qBJpa27wJdKdJ1dqZwqE8gPrwL3ujcO_tM_XiSw0r8Krvkk" alt="AWP | Gungnir" loading="lazy" style={{width:"100%",height:"100%",objectFit:"contain"}} />
                </div>
                <p className="hero__card-name">AWP | Gungnir</p>
                <div className="hero__card-bottom">
                  <span className="hero__card-price">{format(1290)}</span>
                </div>
              </div>
              <div className="hero__card" style={{"--i":2,"--color":"#eb4b4b"} as React.CSSProperties}>
                <div className="hero__card-line"></div>
                <div className="hero__card-meta">
                  <span className="hero__card-rarity">COVERT</span>
                  <span className="hero__card-wear">Field-Tested</span>
                </div>
                <div className="hero__card-preview">
                  <img src="https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwT09S5g4yCmfDLPr7Vn35cppYo0riZp4-t3Q2x_UVpYGr6LIXHJABrYVGB_QS5k72905S_75ycm3t9-n51e4WtYjg" alt="M4A4 | Howl" loading="lazy" style={{width:"100%",height:"100%",objectFit:"contain"}} />
                </div>
                <p className="hero__card-name">M4A4 | Howl</p>
                <div className="hero__card-bottom">
                  <span className="hero__card-price">{format(1850)}</span>
                </div>
              </div>
            </div>

            <div className="hero__payouts">
              <div className="hero__payouts-header">
                <span className="hero__payouts-dot"></span>
                {t("recentPayouts")}
              </div>
              <div className="hero__payout-row" ref={(el) => { payoutRowRefs.current[0] = el; }} style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}>
                <div className="hero__payout-user"><span>W</span> Wa1halla</div>
                <span className="hero__payout-amount">{format(412)}</span>
              </div>
              <div className="hero__payout-row" ref={(el) => { payoutRowRefs.current[1] = el; }} style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}>
                <div className="hero__payout-user"><span>k</span> kukas</div>
                <span className="hero__payout-amount">{format(89.5)}</span>
              </div>
              <div className="hero__payout-row" ref={(el) => { payoutRowRefs.current[2] = el; }} style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}>
                <div className="hero__payout-user"><span>G</span> G7AX</div>
                <span className="hero__payout-amount">{format(267)}</span>
              </div>
              <div className="hero__payout-row" ref={(el) => { payoutRowRefs.current[3] = el; }} style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}>
                <div className="hero__payout-user"><span>Р</span> РЫБАК</div>
                <span className="hero__payout-amount">{format(154)}</span>
              </div>
              <div className="hero__payout-row" ref={(el) => { payoutRowRefs.current[4] = el; }} style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}>
                <div className="hero__payout-user"><span>T</span> Tr1ple</div>
                <span className="hero__payout-amount">{format(38.7)}</span>
              </div>
              <div className="hero__payout-row" ref={(el) => { payoutRowRefs.current[5] = el; }} style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}>
                <div className="hero__payout-user"><span>p</span> pinkgose</div>
                <span className="hero__payout-amount">{format(491)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero__stats-bar">
          <div className="container hero__stats-inner">
            <span><strong>15K+</strong> {t("statsSkins")}</span>
            <span className="hero__stats-dot">&bull;</span>
            <span><strong>12K+</strong> {t("statsSellers")}</span>
            <span className="hero__stats-dot">&bull;</span>
            <a href="https://www.trustpilot.com/review/skinsell.com" target="_blank" rel="noopener noreferrer" className="hero__trustpilot">
              <img src="/trustpilot.png" alt="Trustpilot" width="18" height="18" />
              <strong>4.2</strong> Trustpilot
            </a>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="steps-section" id="howItWorks">
        <div className="container">
          <h2 className="steps-section__title fade-up">{t("stepsTitle")} <span>{t("stepsTitleAccent")}</span></h2>
          <p className="steps-section__sub fade-up">{t("stepsSub")}</p>

          <div className="steps-timeline">
            <div className="steps-timeline__line">
              <div className="steps-timeline__progress"></div>
            </div>

            <div className="step" data-step="1">
              <div className="step__dot"><span>01</span></div>
              <div className="step__card" data-num="01">
                <div className="step__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                </div>
                <div className="step__content">
                  <h4>{t("step1Title")}</h4>
                  <p>{t("step1Desc")}</p>
                </div>
                <a href="/api/auth/steam" className="step__cta" id="signInStep">{t("step1Cta")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></a>
              </div>
            </div>

            <div className="step" data-step="2">
              <div className="step__dot"><span>02</span></div>
              <div className="step__card" data-num="02">
                <div className="step__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="step__content">
                  <h4>{t("step2Title")}</h4>
                  <p>{t("step2Desc")}</p>
                </div>
                <Link href="/sell" className="step__cta">{t("step2Cta")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></Link>
              </div>
            </div>

            <div className="step" data-step="3">
              <div className="step__dot"><span>03</span></div>
              <div className="step__card" data-num="03">
                <div className="step__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <div className="step__content">
                  <h4>{t("step3Title")}</h4>
                  <p>{t("step3Desc")}</p>
                </div>
                <Link href="/sell" className="step__cta">{t("step3Cta")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SUPPORTED GAMES ═══ */}
      <section className="games-section fade-up">
        <div className="container">
          <h2 className="section-title">{t("gamesTitle")} <span>{t("gamesTitleAccent")}</span></h2>
          <p className="section-sub">{t("gamesSub")}</p>

          <div className="card-stack">
            <div className="card-stack__card" data-i="0" style={{"--g1":"#e2740e","--g2":"#c2590a","--bg-img":"url('https://cdn.cloudflare.steamstatic.com/steam/apps/730/capsule_616x353.jpg')"} as React.CSSProperties}>
              <span className="card-stack__tag">CS2</span>
              <div className="card-stack__glass">
                <div className="card-stack__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><line x1="12" y1="3" x2="12" y2="7" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="3" y1="12" x2="7" y2="12" /><line x1="17" y1="12" x2="21" y2="12" /><circle cx="12" cy="12" r="1.5" fill="#fff" stroke="none" /></svg></div>
                <h3>{t("gameCs2")}</h3>
                <p>{t("gameCs2Desc")}</p>
              </div>
            </div>
            <div className="card-stack__card" data-i="1" style={{"--g1":"#dc2626","--g2":"#b91c1c","--bg-img":"url('https://cdn.cloudflare.steamstatic.com/steam/apps/570/capsule_616x353.jpg')"} as React.CSSProperties}>
              <span className="card-stack__tag">DOTA 2</span>
              <div className="card-stack__glass">
                <div className="card-stack__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 8v8l8 6 8-6V8l-8-6z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" /><path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg></div>
                <h3>{t("gameDota")}</h3>
                <p>{t("gameDotaDesc")}</p>
              </div>
            </div>
            <div className="card-stack__card" data-i="2" style={{"--g1":"#ca8a04","--g2":"#a16207","--bg-img":"url('https://cdn.cloudflare.steamstatic.com/steam/apps/440/capsule_616x353.jpg')"} as React.CSSProperties}>
              <span className="card-stack__tag">TF2</span>
              <div className="card-stack__glass">
                <div className="card-stack__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 2-2 3-4 3s-4-1-4-3a4 4 0 0 1 4-4z" /><path d="M14.5 9l2.5 4H7l2.5-4" /><rect x="8" y="13" width="8" height="4" rx="1" /><path d="M10 17v3M14 17v3" /></svg></div>
                <h3>{t("gameTf2")}</h3>
                <p>{t("gameTf2Desc")}</p>
              </div>
            </div>
            <div className="card-stack__card" data-i="3" style={{"--g1":"#16a34a","--g2":"#15803d","--bg-img":"url('https://cdn.cloudflare.steamstatic.com/steam/apps/252490/capsule_616x353.jpg')"} as React.CSSProperties}>
              <span className="card-stack__tag">RUST</span>
              <div className="card-stack__glass">
                <div className="card-stack__icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg></div>
                <h3>{t("gameRust")}</h3>
                <p>{t("gameRustDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PAYMENT METHODS ═══ */}
      <section className="payouts-section fade-up">
        <div className="container">
          <h2 className="payouts-section__title">{t("payoutTitle")} <span>{t("payoutTitleAccent")}</span></h2>
          <p className="payouts-section__sub">{t("payoutSub")}</p>
          <div className="payouts-grid">
            {payoutMethodsForGrid.map((pm) => {
              const color = PAYOUT_CARD_COLORS[pm.type] ?? PAYOUT_CARD_COLORS.other;
              const fee = parseFloat(pm.commission);
              const minAmt = parseFloat(pm.minAmount);
              return (
                <div key={pm.id} className="payout-card" style={{"--pc": color} as React.CSSProperties}>
              <div className="payout-card__inner payout-card__front">
                <div className="payout-card__logo-wrap">
                      <PayoutCardIcon type={pm.type} />
                </div>
                <span className="payout-card__badge">{t("payoutBadgeInstant")}</span>
                    <h3>{pm.name}</h3>
                    <p>{fee > 0 ? `${t("payoutFee")}: ${fee}%` : t("payoutVisaDesc")}</p>
              </div>
              <div className="payout-card__inner payout-card__back">
                <h4>{t("payoutDetails")}</h4>
                <ul>
                      <li>{t("payoutMinWd")}: {minAmt > 0 ? `${minAmt}$` : "0$"}</li>
                      <li>{t("payoutFee")}: {fee > 0 ? `${fee}%` : "0%"}</li>
                </ul>
              </div>
                </div>
              );
            })}
          </div>

          <div className="payouts-notice">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <p><strong>{t("payoutNoticeStrong")}</strong> {t("payoutNotice")}</p>
          </div>
        </div>
      </section>

      {/* ═══ REVIEWS CAROUSEL ═══ */}
      <section className="reviews-section" id="reviews">
        <div className="container">
          <h2 className="section-title fade-up">{t("reviewsTitle")} <span>{t("reviewsTitleAccent")}</span></h2>
          <p className="section-sub fade-up">{t("reviewsSub")}</p>
        </div>

        <div
          className="carousel"
          aria-roledescription="carousel"
          aria-label="Customer reviews"
          tabIndex={0}
          onMouseEnter={stopAuto}
          onMouseLeave={startAuto}
          onMouseDown={(e) => handleDragStart(e.clientX)}
          onMouseUp={(e) => handleDragEnd(e.clientX)}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
          onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
        >
          <div className="carousel__viewport">
            {reviewData.map((r, i) => (
              <div key={`${r.steam}-${i}`} className={`carousel__slide ${getSlideClass(i)}`} data-index={i}>
                <div className="review-card">
                <span className="review-card__quote">&ldquo;</span>
                <div className="review-card__header">
                    <div className="review-card__avatar"><img src={r.avatar} alt={r.user} loading="lazy" /></div>
                  <div className="review-card__user">
                      <a href={r.steam} className="review-card__name" target="_blank" rel="noopener">{r.user}</a>
                      <div className="review-card__stars" aria-label={`${r.stars} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, s) => (
                          <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity={s < r.stars ? 1 : 0.25}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        ))}
              </div>
            </div>
                  </div>
                  <p className="review-card__text">{locale === "ru" ? (r.ru || r.en) : (r.en || r.ru)}</p>
                <div className="review-card__footer">
                    <span className="review-card__game">{r.game}</span>
                    <a href={r.steam} className="review-card__steam-btn" target="_blank" rel="noopener"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg> {t("steamProfile")}</a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="carousel__arrow carousel__arrow--prev" aria-label="Previous review" onClick={goPrev}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button className="carousel__arrow carousel__arrow--next" aria-label="Next review" onClick={goNext}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="features" id="features">
        <div className="container">
          <h2 className="features__title fade-up">{t("featuresTitle")} <span>{t("featuresTitleAccent")}</span></h2>
          <p className="features__sub fade-up">{t("featuresSub")}</p>

          <div className="features__grid">
            <div className="feature-card" style={{"--fi":0} as React.CSSProperties}>
              <span className="feature-card__num">01</span>
              <div className="feature-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <span className="feature-card__stat">{t("f1stat")}</span>
              <h3>{t("f1title")}</h3>
              <p>{t("f1desc")}</p>
            </div>
            <div className="feature-card" style={{"--fi":1} as React.CSSProperties}>
              <span className="feature-card__num">02</span>
              <div className="feature-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <span className="feature-card__stat">{t("f2stat")}</span>
              <h3>{t("f2title")}</h3>
              <p>{t("f2desc")}</p>
            </div>
            <div className="feature-card" style={{"--fi":2} as React.CSSProperties}>
              <span className="feature-card__num">03</span>
              <div className="feature-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
              <span className="feature-card__stat">{t("f3stat")}</span>
              <h3>{t("f3title")}</h3>
              <p>{t("f3desc")}</p>
            </div>
            <div className="feature-card" style={{"--fi":3} as React.CSSProperties}>
              <span className="feature-card__num">04</span>
              <div className="feature-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              </div>
              <span className="feature-card__stat">{t("f4stat")}</span>
              <h3>{t("f4title")}</h3>
              <p>{t("f4desc")}</p>
            </div>
            <div className="feature-card" style={{"--fi":4} as React.CSSProperties}>
              <span className="feature-card__num">05</span>
              <div className="feature-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
              </div>
              <span className="feature-card__stat">{t("f5stat")}</span>
              <h3>{t("f5title")}</h3>
              <p>{t("f5desc")}</p>
            </div>
            <div className="feature-card" style={{"--fi":5} as React.CSSProperties}>
              <span className="feature-card__num">06</span>
              <div className="feature-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              </div>
              <span className="feature-card__stat">{t("f6stat")}</span>
              <h3>{t("f6title")}</h3>
              <p>{t("f6desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ PREVIEW ═══ */}
      <section className="faq-preview" id="faqPreview">
        <div className="container">
          <h2 className="section-title fade-up">{t("faqPreviewTitle")} <span>{t("faqPreviewAccent")}</span></h2>
          <p className="section-sub fade-up">{t("faqPreviewSub")} <Link href="/faq">{t("faqPreviewLink")}</Link></p>

          <div className="faq-list">
            <div className={`faq-item${openFaqIdx === 0 ? " open" : ""}`} style={{"--fi":0} as React.CSSProperties}>
              <button className="faq-item__q" aria-expanded={openFaqIdx === 0 ? "true" : "false"} onClick={() => toggleFaq(0)}>
                <span className="faq-item__num">01</span>
                <svg className="faq-item__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                <span>{t("faq1q")}</span>
                <svg className="faq-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <div className="faq-item__a">
                <p>{t("faq1a")}</p>
              </div>
            </div>
            <div className={`faq-item${openFaqIdx === 1 ? " open" : ""}`} style={{"--fi":1} as React.CSSProperties}>
              <button className="faq-item__q" aria-expanded={openFaqIdx === 1 ? "true" : "false"} onClick={() => toggleFaq(1)}>
                <span className="faq-item__num">02</span>
                <svg className="faq-item__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><line x1="12" y1="3" x2="12" y2="7" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="3" y1="12" x2="7" y2="12" /><line x1="17" y1="12" x2="21" y2="12" /></svg>
                <span>{t("faq2q")}</span>
                <svg className="faq-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <div className="faq-item__a">
                <p>{t("faq2a")}</p>
              </div>
            </div>
            <div className={`faq-item${openFaqIdx === 2 ? " open" : ""}`} style={{"--fi":2} as React.CSSProperties}>
              <button className="faq-item__q" aria-expanded={openFaqIdx === 2 ? "true" : "false"} onClick={() => toggleFaq(2)}>
                <span className="faq-item__num">03</span>
                <svg className="faq-item__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <span>{t("faq3q")}</span>
                <svg className="faq-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <div className="faq-item__a">
                <p>{t("faq3a")}</p>
              </div>
            </div>
            <div className={`faq-item${openFaqIdx === 3 ? " open" : ""}`} style={{"--fi":3} as React.CSSProperties}>
              <button className="faq-item__q" aria-expanded={openFaqIdx === 3 ? "true" : "false"} onClick={() => toggleFaq(3)}>
                <span className="faq-item__num">04</span>
                <svg className="faq-item__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /><path d="M6 16h4" /></svg>
                <span>{t("faq4q")}</span>
                <svg className="faq-item__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <div className="faq-item__a">
                <p>{t("faq4a")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
