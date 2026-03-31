"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/components/currency-provider";

const PAYOUT_NAMES = [
  "Nugaev", "kukas", "Nomad", "hokage", "Conq3r",
  "Razrez", "G7AX", "maestro", "mango", "Matt",
  "MauseR", "max1moff_", "Mason", "mayONEZY", "MaF1ozee",
  "madnothappy", "Maisie", "MakaR", "MAXIS", "mataso",
  "Mangekyō", "NoT1cE", "anger", "РЫБАК", "Wa1halla",
  "pinkgose", "maz1k", "MADMAX", "mARNESY", "Mag1st0r",
];

const REVIEWS = [
  { user: "DonationTrashBot", steam: "https://steamcommunity.com/id/DonationTrashBot", text: "Listed a few surplus items and the whole flow took minutes. Payout hit my wallet faster than I expected.", game: "CS2", av1: "#1e3a5f", av2: "#4a90d9", stars: 5 },
  { user: "nZarr", steam: "https://steamcommunity.com/id/nZarr", text: "Quick payout, love it! Super easy to list skins.", game: "CS2", av1: "#2d1f3d", av2: "#c77dff", stars: 5 },
  { user: "ubrtwelie", steam: "https://steamcommunity.com/id/ubrtwelie", text: "Sold my knife here after comparing a few sites — best offer and zero hassle.", game: "CS2", av1: "#0f2d26", av2: "#3ecf8e", stars: 5 },
  { user: "amnyam_mode", steam: "https://steamcommunity.com/id/amnyam_mode", text: "Interface is clean and I didn't have to dig through menus. Cashout was smooth.", game: "CS2", av1: "#3d2817", av2: "#e8a838", stars: 4 },
  { user: "hotojour", steam: "https://steamcommunity.com/id/hotojour", text: "First time selling skins online and it was straightforward from login to payout. Good prices.", game: "Dota 2", av1: "#1a0a2e", av2: "#ff6b9d", stars: 5 },
  { user: "deshumitsu", steam: "https://steamcommunity.com/id/deshumitsu", text: "Traded out some Dota arcanas. Speed was great — order cleared and I had funds the same evening.", game: "Dota 2", av1: "#142850", av2: "#64b5f6", stars: 5 },
  { user: "lilxant", steam: "https://steamcommunity.com/id/lilxant", text: "Reliable for high-tier CS skins. Support answered my question quickly too.", game: "CS2", av1: "#2e1065", av2: "#a78bfa", stars: 5 },
  { user: "kerfmit", steam: "https://steamcommunity.com/id/kerfmit", text: "Payout came through without chasing anyone. Ease of use is top tier.", game: "CS2", av1: "#0d3b2c", av2: "#2dd4bf", stars: 5 },
  { user: "vikk01", steam: "https://steamcommunity.com/id/vikk01", text: "Solid rates on gloves. Everything felt transparent; no surprises when the sale completed.", game: "CS2", av1: "#3b0764", av2: "#f472b6", stars: 4 },
  { user: "SilenseMS", steam: "https://steamcommunity.com/id/SilenseMS", text: "Been using this for a while. Consistent speed, good liquidity, prices track the market well.", game: "CS2", av1: "#1c1917", av2: "#a8a29e", stars: 5 },
  { user: "ProVatan", steam: "https://steamcommunity.com/id/ProVatan", text: "Quick sale on a mid-tier rifle skin. Site is easy to navigate and the payout didn't drag.", game: "CS2", av1: "#7f1d1d", av2: "#fca5a5", stars: 5 },
  { user: "TheTanyaVonDegurechaff", steam: "https://steamcommunity.com/id/TheTanyaVonDegurechaff", text: "Long review short: I trust this place more than random Discord buyers. Fair quote, fast settlement.", game: "Dota 2", av1: "#312e81", av2: "#818cf8", stars: 5 },
  { user: "alwaysbeingmad", steam: "https://steamcommunity.com/id/alwaysbeingmad", text: "TF2 unusual sold without drama. Price was competitive and I didn't have to babysit the trade.", game: "TF2", av1: "#713f12", av2: "#fbbf24", stars: 5 },
  { user: "sh_oomg", steam: "https://steamcommunity.com/id/sh_oomg", text: "Rust skins aren't always easy to cash out — here it was painless and the offer beat my expectations.", game: "Rust", av1: "#422006", av2: "#fb923c", stars: 5 },
  { user: "rubututu", steam: "https://steamcommunity.com/id/rubututu", text: "Five stars for simplicity. Upload, confirm, get paid — that's it.", game: "CS2", av1: "#134e4a", av2: "#5eead4", stars: 5 },
  { user: "MES4000", steam: "https://steamcommunity.com/id/MES4000", text: "Good experience overall. Payout arrived quickly once the trade was accepted.", game: "CS2", av1: "#4c0519", av2: "#fb7185", stars: 4 },
  { user: "Af1_piece", steam: "https://steamcommunity.com/id/Af1_piece", text: "CS inventory cleanup done right — sold a stack of skins in one session, rates were fair.", game: "CS2", av1: "#164e63", av2: "#38bdf8", stars: 5 },
  { user: "m8chnix", steam: "https://steamcommunity.com/id/m8chnix", text: "Dota sets moved fast. I like that I can see what I'm getting before I commit to sell.", game: "Dota 2", av1: "#3f3f46", av2: "#d4d4d8", stars: 5 },
  { user: "Kazuki", steam: "https://steamcommunity.com/profiles/76561198358221005", text: "Steam trade went through cleanly and money followed shortly after. No stress.", game: "CS2", av1: "#581c87", av2: "#c084fc", stars: 5 },
  { user: "FrostByte", steam: "https://steamcommunity.com/profiles/76561198215365185", text: "Prices aligned with what I saw on trackers. Payout speed is the main reason I keep coming back.", game: "Dota 2", av1: "#0c4a6e", av2: "#7dd3fc", stars: 5 },
  { user: "Nexus", steam: "https://steamcommunity.com/profiles/76561198089414875", text: "Easy for bulk selling — listed several items and didn't get lost in the UI.", game: "CS2", av1: "#14532d", av2: "#86efac", stars: 5 },
  { user: "Cipher", steam: "https://steamcommunity.com/profiles/76561198070671099", text: "TF2 hats: sold a couple, both trades completed fast. Would recommend.", game: "TF2", av1: "#831843", av2: "#f9a8d4", stars: 4 },
  { user: "Phantom", steam: "https://steamcommunity.com/profiles/76561199483113949", text: "Rust item sale was smooth; offer was upfront and payout didn't make me wait.", game: "Rust", av1: "#1e293b", av2: "#94a3b8", stars: 5 },
  { user: "Volt", steam: "https://steamcommunity.com/profiles/76561199275399375", text: "CS2 knife out, cash in — exactly what I needed. Site feels modern and process is quick.", game: "CS2", av1: "#422006", av2: "#fcd34d", stars: 5 },
  { user: "Storm", steam: "https://steamcommunity.com/profiles/76561199212382946", text: "Dota courier sold at a price I was happy with. Support was responsive too.", game: "Dota 2", av1: "#1e3a8a", av2: "#93c5fd", stars: 5 },
  { user: "Pulse", steam: "https://steamcommunity.com/profiles/76561199649161705", text: "Straightforward selling — no endless forms. Payout landed when they said it would.", game: "CS2", av1: "#365314", av2: "#bef264", stars: 5 },
  { user: "Drift", steam: "https://steamcommunity.com/profiles/76561199172392618", text: "Mixed Dota immortals with CS skins; both went fine. Good prices and fast turnaround.", game: "Dota 2", av1: "#4a044e", av2: "#e879f9", stars: 4 },
  { user: "Shadow", steam: "https://steamcommunity.com/profiles/76561199222494168", text: "TF2 trading can be a mess — this was the opposite. Clear steps, quick payout.", game: "TF2", av1: "#0f172a", av2: "#64748b", stars: 5 },
];

const SLIDE_COUNT = REVIEWS.length;

/** Mostly under $500; rarely above $1000 (trust display). */
function randomPayoutAmountUsd(): number {
  const r = Math.random();
  if (r < 0.72) return 15 + Math.random() * 485;
  if (r < 0.92) return 500 + Math.random() * 500;
  return 1000 + Math.random() * 280;
}

export default function HomePage() {
  const t = useTranslations("landing");
  const { format, symbol } = useCurrency();

  /* ── A) Payout rotation ── */
  const payoutIdxRef = useRef(0);
  const payoutRowRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

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
          const name = PAYOUT_NAMES[Math.floor(Math.random() * PAYOUT_NAMES.length)];
          const amountUsd = randomPayoutAmountUsd();
          const userEl = row.querySelector(".hero__payout-user");
          const amountEl = row.querySelector(".hero__payout-amount");
          if (userEl) userEl.innerHTML = `<span>${name[0]}</span> ${name}`;
          if (amountEl) amountEl.textContent = formatRef.current(amountUsd);
          row.style.opacity = "1";
          row.style.transform = "translateY(0)";
        }, 300);
      }
      payoutIdxRef.current = (idx + 1) % 3;
    }, 3500);
    return () => clearInterval(id);
  }, []);

  /* ── B) Reviews carousel ── */
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
      setCurrent((c) => (c + 1) % SLIDE_COUNT);
    }, 5000);
  }, [stopAuto]);

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [startAuto, stopAuto]);

  const goPrev = () => setCurrent((c) => (c - 1 + SLIDE_COUNT) % SLIDE_COUNT);
  const goNext = () => setCurrent((c) => (c + 1) % SLIDE_COUNT);

  const getSlideClass = (index: number) => {
    const diff = ((index - current) % SLIDE_COUNT + SLIDE_COUNT) % SLIDE_COUNT;
    if (diff === 0) return "is-active";
    if (diff === 1) return "is-next";
    if (diff === SLIDE_COUNT - 1) return "is-prev";
    if (diff === 2) return "is-far-next";
    if (diff === SLIDE_COUNT - 2) return "is-far-prev";
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
                  <span className="hero__card-steam">{format(712.5)}</span>
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
                  <span className="hero__card-steam">{format(1380)}</span>
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
                  <span className="hero__card-steam">{format(1950)}</span>
                </div>
              </div>
            </div>

            <div className="hero__payouts">
              <div className="hero__payouts-header">
                <span className="hero__payouts-dot"></span>
                {t("recentPayouts")}
              </div>
              <div className="hero__payout-row" ref={(el) => { payoutRowRefs.current[0] = el; }} style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}>
                <div className="hero__payout-user"><span>N</span> Nugaev</div>
                <span className="hero__payout-amount">{format(412)}</span>
              </div>
              <div className="hero__payout-row" ref={(el) => { payoutRowRefs.current[1] = el; }} style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}>
                <div className="hero__payout-user"><span>M</span> max1moff_</div>
                <span className="hero__payout-amount">{format(89.5)}</span>
              </div>
              <div className="hero__payout-row" ref={(el) => { payoutRowRefs.current[2] = el; }} style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}>
                <div className="hero__payout-user"><span>R</span> Razrez</div>
                <span className="hero__payout-amount">{format(267)}</span>
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
            <span><strong>4.87</strong> {t("statsRating")}</span>
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
            <div className="payout-card" style={{"--pc":"#1A1F71"} as React.CSSProperties}>
              <div className="payout-card__inner payout-card__front">
                <div className="payout-card__logo-wrap">
                  <svg width="40" height="28" viewBox="0 0 48 32"><rect width="48" height="32" rx="4" fill="#1A1F71" /><path d="M20.2 10.5l-3.8 11h-2.8l-1.9-8.8c-.1-.5-.3-.6-.7-.8-.7-.3-1.8-.7-2.8-.9l.1-.5h4.5c.6 0 1.1.4 1.2 1l1.1 5.9 2.8-6.9h2.3zm9.2 7.4c0-2.9-4-3.1-4-4.4 0-.4.4-.8 1.2-.9.6-.1 1.8-.1 2.5.3l.5-2.1c-.6-.2-1.4-.4-2.4-.4-2.5 0-4.3 1.3-4.3 3.2 0 1.4 1.3 2.2 2.2 2.6 1 .5 1.3.8 1.3 1.2 0 .7-.8 1-1.5 1-.9 0-1.7-.2-2.4-.5l-.5 2.2c.7.3 1.7.4 2.7.4 2.7 0 4.5-1.3 4.5-3.3l.2-.3zm6.7 3.6h2.5l-2.2-11h-2.3c-.5 0-.9.3-1.1.7l-3.8 10.3h2.7l.5-1.5h3.3l.4 1.5zm-2.8-3.5l1.4-3.7.8 3.7h-2.2z" fill="#fff" /></svg>
                  <svg width="40" height="28" viewBox="0 0 48 32"><rect width="48" height="32" rx="4" fill="#EB001B" opacity="0" /><circle cx="18" cy="16" r="10" fill="#EB001B" /><circle cx="30" cy="16" r="10" fill="#F79E1B" /><path d="M24 8.6a10 10 0 0 1 3.7 7.4A10 10 0 0 1 24 23.4 10 10 0 0 1 20.3 16 10 10 0 0 1 24 8.6z" fill="#FF5F00" /></svg>
                </div>
                <span className="payout-card__badge">{t("payoutBadgeInstant")}</span>
                <h3>{t("payoutVisa")}</h3>
                <p>{t("payoutVisaDesc")}</p>
              </div>
              <div className="payout-card__inner payout-card__back">
                <h4>{t("payoutDetails")}</h4>
                <ul>
                  <li>{t("payoutMinWd")}: 1$</li>
                  <li>{t("payoutProcessing")}: {t("payoutBadgeInstant")}</li>
                  <li>{t("payoutFee")}: 0%</li>
                </ul>
              </div>
            </div>
            <div className="payout-card" style={{"--pc":"#F7931A"} as React.CSSProperties}>
              <div className="payout-card__inner payout-card__front">
                <div className="payout-card__logo-wrap">
                  <svg width="44" height="44" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#F7931A" /><path d="M22.5 14c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.6 2.6c-.4-.1-.9-.2-1.3-.3l.7-2.6-1.7-.4-.7 2.7c-.4-.1-.7-.2-1-.2v-.1l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 .1.1.1.1.1h-.1l-1.2 4.7c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.7.4.7-2.8c2.8.5 5 .3 5.9-2.2.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.6zm-3.7 5.2c-.5 2.1-4.1 1-5.3.7l1-3.8c1.1.3 4.9.8 4.3 3.1zm.5-5.3c-.5 1.9-3.5.9-4.4.7l.8-3.4c1 .2 4.1.7 3.6 2.7z" fill="#fff" /></svg>
                </div>
                <span className="payout-card__badge">{t("payoutBadge10m")}</span>
                <h3>{t("payoutBtc")}</h3>
                <p>{t("payoutBtcDesc")}</p>
              </div>
              <div className="payout-card__inner payout-card__back">
                <h4>{t("payoutDetails")}</h4>
                <ul>
                  <li>{t("payoutMinWd")}: 10$</li>
                  <li>{t("payoutProcessing")}: {t("payoutBadge10m")}</li>
                  <li>{t("payoutNetwork")}: BTC</li>
                </ul>
              </div>
            </div>
            <div className="payout-card" style={{"--pc":"#26A17B"} as React.CSSProperties}>
              <div className="payout-card__inner payout-card__front">
                <div className="payout-card__logo-wrap">
                  <svg width="44" height="44" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#26A17B" /><path d="M17.9 17.2v0c-.1 0-.7.1-2 .1-1 0-1.7 0-1.9-.1v0c-3.8-.2-6.6-.8-6.6-1.6s2.8-1.5 6.6-1.6v2.6c.3 0 1 .1 2 .1 1.2 0 1.8-.1 1.9-.1v-2.6c3.8.2 6.6.8 6.6 1.6s-2.8 1.4-6.6 1.6zm0-3.5V11h5.3V8H8.9v3h5.3v2.7c-4.3.2-7.5 1.1-7.5 2.1s3.2 1.9 7.5 2.1v7.6h3.7v-7.6c4.3-.2 7.5-1.1 7.5-2.1s-3.2-1.9-7.5-2.1z" fill="#fff" /></svg>
                </div>
                <span className="payout-card__badge">{t("payoutBadgeInstant")}</span>
                <h3>{t("payoutUsdt")}</h3>
                <p>{t("payoutUsdtDesc")}</p>
              </div>
              <div className="payout-card__inner payout-card__back">
                <h4>{t("payoutDetails")}</h4>
                <ul>
                  <li>{t("payoutMinWd")}: 5$</li>
                  <li>{t("payoutProcessing")}: {t("payoutBadgeInstant")}</li>
                  <li>{t("payoutNetwork")}: TRC-20</li>
                </ul>
              </div>
            </div>
            <div className="payout-card" style={{"--pc":"#6366f1"} as React.CSSProperties}>
              <div className="payout-card__inner payout-card__front">
                <div className="payout-card__logo-wrap">
                  <svg width="44" height="44" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#6366f1" /><path d="M8 12h16M8 16h12M8 20h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><rect x="20" y="18" width="5" height="4" rx="1" fill="#fff" opacity="0.7" /></svg>
                </div>
                <span className="payout-card__badge">{t("payoutBadge12d")}</span>
                <h3>{t("payoutBank")}</h3>
                <p>{t("payoutBankDesc")}</p>
              </div>
              <div className="payout-card__inner payout-card__back">
                <h4>{t("payoutDetails")}</h4>
                <ul>
                  <li>{t("payoutMinWd")}: 50$</li>
                  <li>{t("payoutProcessing")}: {t("payoutBadge12d")}</li>
                  <li>{t("payoutFee")}: 0%</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="payouts-grid payouts-grid--row2">
            <div className="payout-card" style={{"--pc":"#627eea"} as React.CSSProperties}>
              <div className="payout-card__inner payout-card__front">
                <div className="payout-card__logo-wrap">
                  <svg width="44" height="44" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#627eea"/><path d="M16.5 4v8.87l7.5 3.35L16.5 4z" fill="#fff" opacity=".6"/><path d="M16.5 4L9 16.22l7.5-3.35V4z" fill="#fff"/><path d="M16.5 21.97v6.03L24 17.62l-7.5 4.35z" fill="#fff" opacity=".6"/><path d="M16.5 28V21.97L9 17.62 16.5 28z" fill="#fff"/><path d="M16.5 20.57l7.5-4.35-7.5-3.35v7.7z" fill="#fff" opacity=".2"/><path d="M9 16.22l7.5 4.35v-7.7L9 16.22z" fill="#fff" opacity=".6"/></svg>
                </div>
                <span className="payout-card__badge">~5 min</span>
                <h3>Ethereum (ERC-20)</h3>
                <p>Fast on-chain ETH transfer</p>
              </div>
              <div className="payout-card__inner payout-card__back">
                <h4>{t("payoutDetails")}</h4>
                <ul>
                  <li>{t("payoutMinWd")}: 10$</li>
                  <li>{t("payoutProcessing")}: ~5 min</li>
                  <li>{t("payoutFee")}: 1%</li>
                </ul>
              </div>
            </div>
            <div className="payout-card" style={{"--pc":"#26A17B"} as React.CSSProperties}>
              <div className="payout-card__inner payout-card__front">
                <div className="payout-card__logo-wrap">
                  <svg width="44" height="44" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#26A17B"/><path d="M17.9 17.2v0c-.1 0-.7.1-2 .1-1 0-1.7 0-1.9-.1v0c-3.8-.2-6.6-.8-6.6-1.6s2.8-1.5 6.6-1.6v2.6c.3 0 1 .1 2 .1 1.2 0 1.8-.1 1.9-.1v-2.6c3.8.2 6.6.8 6.6 1.6s-2.8 1.4-6.6 1.6zm0-3.5V11h5.3V8H8.9v3h5.3v2.7c-4.3.2-7.5 1.1-7.5 2.1s3.2 1.9 7.5 2.1v7.6h3.7v-7.6c4.3-.2 7.5-1.1 7.5-2.1s-3.2-1.9-7.5-2.1z" fill="#fff"/></svg>
                </div>
                <span className="payout-card__badge">{t("payoutBadgeInstant")}</span>
                <h3>USDT (ERC-20)</h3>
                <p>Stablecoin via Ethereum network</p>
              </div>
              <div className="payout-card__inner payout-card__back">
                <h4>{t("payoutDetails")}</h4>
                <ul>
                  <li>{t("payoutMinWd")}: 10$</li>
                  <li>{t("payoutProcessing")}: ~5 min</li>
                  <li>{t("payoutFee")}: 1%</li>
                </ul>
              </div>
            </div>
            <div className="payout-card" style={{"--pc":"#bfbbbb"} as React.CSSProperties}>
              <div className="payout-card__inner payout-card__front">
                <div className="payout-card__logo-wrap">
                  <svg width="44" height="44" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#bfbbbb"/><path d="M16 5l-1 .4v14.2l1 .6 7-4.1L16 5z" fill="#fff" opacity=".5"/><path d="M16 5L9 16.1l7 4.1V5z" fill="#fff"/><path d="M16 21.5l-.1.1v5.4l.1.3 7-9.8-7 4z" fill="#fff" opacity=".5"/><path d="M16 27.3v-5.8L9 17.5l7 9.8z" fill="#fff"/></svg>
                </div>
                <span className="payout-card__badge">~10 min</span>
                <h3>Litecoin (LTC)</h3>
                <p>Low-fee crypto payments</p>
              </div>
              <div className="payout-card__inner payout-card__back">
                <h4>{t("payoutDetails")}</h4>
                <ul>
                  <li>{t("payoutMinWd")}: 5$</li>
                  <li>{t("payoutProcessing")}: ~10 min</li>
                  <li>{t("payoutFee")}: 1%</li>
                </ul>
              </div>
            </div>
            <div className="payout-card" style={{"--pc":"#f59e0b"} as React.CSSProperties}>
              <div className="payout-card__inner payout-card__front">
                <div className="payout-card__logo-wrap">
                  <svg width="44" height="44" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#f59e0b"/><path d="M21 12a5 5 0 01-5 5h-3v5h-2V7h5a5 5 0 015 5z" fill="#fff"/><path d="M13 17h4a4 4 0 010 8h-4v-8z" fill="#fff" opacity=".7"/></svg>
                </div>
                <span className="payout-card__badge">{t("payoutBadgeInstant")}</span>
                <h3>Balance</h3>
                <p>Instant credit to your account</p>
              </div>
              <div className="payout-card__inner payout-card__back">
                <h4>{t("payoutDetails")}</h4>
                <ul>
                  <li>{t("payoutMinWd")}: 0$</li>
                  <li>{t("payoutProcessing")}: {t("payoutBadgeInstant")}</li>
                  <li>{t("payoutFee")}: 0%</li>
                </ul>
              </div>
            </div>
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
            {REVIEWS.map((r, i) => (
              <div key={r.user} className={`carousel__slide ${getSlideClass(i)}`} data-index={i}>
                <div className="review-card" style={{"--av1": r.av1, "--av2": r.av2} as React.CSSProperties}>
                  <span className="review-card__quote">&ldquo;</span>
                  <div className="review-card__header">
                    <div className="review-card__avatar"><span>{r.user.charAt(0).toUpperCase()}</span></div>
                    <div className="review-card__user">
                      <a href={r.steam} className="review-card__name" target="_blank" rel="noopener">{r.user}</a>
                      <div className="review-card__stars" aria-label={`${r.stars} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, s) => (
                          <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity={s < r.stars ? 1 : 0.25}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="review-card__text">{r.text}</p>
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
