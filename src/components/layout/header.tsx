"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname, Link } from "@/i18n/navigation";
import NextLink from "next/link";
import { useSession } from "@/components/session-provider";
import { useCurrency, type CurrencyCode } from "@/components/currency-provider";
import { useLocale, useTranslations } from "next-intl";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const { user, loading } = useSession();
  const { currency, setCurrency, format } = useCurrency();
  const t = useTranslations("common");
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState(() => currentLocale === "ru" ? "RU" : "EN");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const currencyRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (avatarMenuOpen) {
      document.body.classList.add("avatar-blur");
    } else {
      document.body.classList.remove("avatar-blur");
    }
    return () => document.body.classList.remove("avatar-blur");
  }, [avatarMenuOpen]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docH > 0 ? Math.min(window.scrollY / docH, 1) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const link = e.currentTarget;
    const nav = navRef.current;
    const slider = sliderRef.current;
    if (!nav || !slider) return;
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    slider.style.left = `${linkRect.left - navRect.left}px`;
    slider.style.top = `${linkRect.top - navRect.top}px`;
    slider.style.width = `${linkRect.width}px`;
    slider.style.height = `${linkRect.height}px`;
    slider.style.opacity = "1";
  }, []);

  const handleNavMouseLeave = useCallback(() => {
    const slider = sliderRef.current;
    if (slider) slider.style.opacity = "0";
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setCurrencyOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    const urlLang = currentLocale === "ru" ? "RU" : "EN";
    const savedLang = localStorage.getItem("sw_lang");
    if (savedLang) {
      setLang(savedLang);
    } else {
      setLang(urlLang);
      localStorage.setItem("sw_lang", urlLang);
    }
  }, [currentLocale]);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  const handleCurrency = (c: string) => {
    setCurrency(c as CurrencyCode);
    setCurrencyOpen(false);
  };

  const handleLang = (l: string) => {
    setLang(l);
    setLangOpen(false);
    localStorage.setItem("sw_lang", l);
    const locale = l.toLowerCase() as "en" | "ru";
    router.replace(pathname || "/", { locale });
  };

  return (
    <>
      <header className={`header${scrolled ? " is-scrolled" : ""}`}>
        <div className="header__scroll-progress" style={{ transform: `scaleX(${scrollProgress})` }} />
        <div className="header__inner">
          <div className="header__left">
            <Link href="/" className="header__logo">
              <svg className="header__logo-icon" width="36" height="36" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <g transform="translate(0,1024) scale(0.1,-0.1)" fill="url(#logoGrad)">
                  <path d="M5043 8011 c-67 -17 -127 -69 -399 -343 -257 -258 -283 -288 -299 -336 -19 -59 -15 -104 15 -162 22 -42 595 -615 647 -647 53 -32 103 -37 166 -19 51 15 72 33 371 331 200 198 322 328 331 349 19 45 19 101 0 157 -13 37 -64 93 -308 336 -171 171 -309 300 -332 312 -46 23 -143 34 -192 22z"/>
                  <path d="M6109 6966 c-20 -8 -51 -22 -70 -31 -34 -18 -398 -377 -1442 -1423 -386 -388 -585 -580 -612 -593 -75 -35 -143 -18 -186 47 -23 35 -26 120 -5 149 8 11 71 76 141 145 69 69 294 293 498 498 409 410 411 413 389 500 -11 43 -35 70 -320 351 -340 336 -365 355 -467 354 -118 -1 -89 24 -912 -796 -840 -839 -807 -801 -808 -937 0 -136 -31 -100 767 -896 676 -675 716 -713 771 -733 69 -25 143 -27 218 -5 53 15 80 42 1064 1024 816 815 1016 1009 1043 1015 124 26 229 -85 192 -202 -10 -30 -114 -140 -479 -508 -409 -411 -469 -475 -480 -513 -13 -45 -8 -89 14 -132 24 -46 632 -643 683 -670 39 -21 61 -25 132 -25 71 0 93 4 135 25 38 19 218 192 771 743 813 809 769 757 769 907 -1 68 -5 94 -23 131 -17 34 -187 210 -636 660 -776 778 -873 872 -925 899 -55 28 -170 36 -222 16z"/>
                  <path d="M5049 4041 c-55 -17 -84 -44 -397 -355 -224 -222 -331 -335 -348 -368 -30 -58 -32 -135 -5 -193 24 -52 644 -671 704 -702 54 -29 145 -30 202 -4 26 12 160 137 381 357 324 321 342 341 351 386 12 57 1 127 -26 172 -33 51 -679 679 -719 698 -39 18 -99 22 -143 9z"/>
                </g>
              </svg>
              <span className="header__logo-text">SKINSELL</span>
            </Link>
          </div>

          <nav ref={navRef} className={`header__nav${mobileOpen ? " open" : ""}`} onMouseLeave={handleNavMouseLeave}>
            <div ref={sliderRef} className="header__nav-slider" />
            <Link href="/sell" className={isActive("/sell") ? "active" : ""} onClick={() => setMobileOpen(false)} onMouseEnter={handleNavMouseEnter}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> {t("sellSkins")}
            </Link>
            <span className="header__nav-sep" />
            <Link href="/#reviews" className={pathname === "/" ? "active" : ""} onClick={() => setMobileOpen(false)} onMouseEnter={handleNavMouseEnter}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> {t("reviews")}
            </Link>
            <span className="header__nav-sep" />
            <Link href="/faq" className={isActive("/faq") ? "active" : ""} onClick={() => setMobileOpen(false)} onMouseEnter={handleNavMouseEnter}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg> {t("faq")}
            </Link>
          </nav>

          <div className="header__right">
            <div className={`header__dropdown-wrap${currencyOpen ? " is-open" : ""}`} ref={currencyRef}>
              <button className="header__select" onClick={(e) => { e.stopPropagation(); setCurrencyOpen(!currencyOpen); setLangOpen(false); }}>
                <span>{currency}</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="header__dropdown">
                {[
                  { code: "USD", symbol: "$" },
                  { code: "EUR", symbol: "€" },
                  { code: "RUB", symbol: "₽" },
                ].map(c => (
                  <button key={c.code} className={`header__dropdown-item${currency === c.code ? " is-active" : ""}`} onClick={() => handleCurrency(c.code)}>{c.symbol} {c.code}</button>
                ))}
              </div>
            </div>
            <div className={`header__dropdown-wrap${langOpen ? " is-open" : ""}`} ref={langRef}>
              <button className="header__select" onClick={(e) => { e.stopPropagation(); setLangOpen(!langOpen); setCurrencyOpen(false); }}>
                <img className="header__flag" src={lang === "RU" ? "/flags/ru.png" : "/flags/us.png"} alt="" width="28" height="28" />
                <span>{lang}</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="header__dropdown">
                <button className={`header__dropdown-item${lang === "EN" ? " is-active" : ""}`} onClick={() => handleLang("EN")}>
                  <img className="header__flag" src="/flags/us.png" alt="" width="28" height="28" />
                  English
                </button>
                <button className={`header__dropdown-item${lang === "RU" ? " is-active" : ""}`} onClick={() => handleLang("RU")}>
                  <img className="header__flag" src="/flags/ru.png" alt="" width="28" height="28" />
                  Русский
                </button>
              </div>
            </div>
            <div className="header__divider"></div>

            {!loading && !user && (
              <a href="/api/auth/steam" className="header__login-btn">
                <svg className="header__login-steam" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-9.96 9.04l5.35 2.21a2.83 2.83 0 0 1 1.6-.49c.05 0 .1 0 .16.01l2.4-3.47v-.05a3.77 3.77 0 0 1 3.77-3.77 3.77 3.77 0 0 1 3.77 3.77 3.77 3.77 0 0 1-3.77 3.77h-.09l-3.41 2.44c0 .04.01.09.01.13a2.84 2.84 0 0 1-2.84 2.84 2.85 2.85 0 0 1-2.8-2.37L2.2 12.9A10 10 0 1 0 12 2zm-1.43 15.1l-1.28-.53a2.13 2.13 0 0 0 2.48 1.09 2.13 2.13 0 0 0 1.36-2.68 2.13 2.13 0 0 0-2.59-1.4l1.32.55a1.57 1.57 0 0 1-.6 3.02 1.57 1.57 0 0 1-.69-1.05zm5.82-7.57a2.52 2.52 0 0 0-2.52-2.51 2.52 2.52 0 0 0-2.51 2.51 2.52 2.52 0 0 0 2.51 2.52 2.52 2.52 0 0 0 2.52-2.52zm-4.4 0a1.89 1.89 0 0 1 1.88-1.89 1.89 1.89 0 0 1 1.89 1.89 1.89 1.89 0 0 1-1.89 1.89 1.89 1.89 0 0 1-1.88-1.89z"/></svg>
                <span>{t("signIn")}</span>
              </a>
            )}

            {!loading && user && (
              <div className="header__user">
                <button
                  className={`header__balance${Number(user.balance ?? 0) === 0 ? " is-zero" : ""}${balanceLoading ? " is-loading" : ""}`}
                  onClick={() => {
                    if (balanceLoading) return;
                    setBalanceLoading(true);
                    setTimeout(() => { router.push("/balance"); setBalanceLoading(false); }, 1000);
                  }}
                >
                  {balanceLoading ? (
                    <span className="header__balance-spinner" />
                  ) : (
                    <svg className="header__balance-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><path d="M6 14h.01"/><path d="M10 14h4"/></svg>
                  )}
                  {format(Number(user.balance ?? 0))}
                </button>
                <div className={`header__avatar-wrap${avatarMenuOpen ? " is-open" : ""}`} onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}>
                  <div className="header__avatar">
                    {user.steamAvatar ? <img src={user.steamAvatar} alt="Avatar" /> : <span>{(user.steamLogin || "U")[0].toUpperCase()}</span>}
                    <span className="header__online-dot" />
                  </div>
                  <div className="header__avatar-info">
                    <span className="header__avatar-name">{user.steamLogin || "User"}</span>
                    <svg className="header__avatar-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>
            )}

            <button className={`header__burger${mobileOpen ? " is-open" : ""}`} aria-label="Menu" onClick={() => setMobileOpen(!mobileOpen)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
      <div className={`header__mob-backdrop${mobileOpen ? " active" : ""}`} onClick={() => setMobileOpen(false)} />
      {/* Mobile menu — outside header to avoid stacking context */}
      <div className={`mob${mobileOpen ? " mob--open" : ""}`}>
        {!loading && user && (
          <div className="mob__profile">
            <div className="mob__avatar">
              {user.steamAvatar ? <img src={user.steamAvatar} alt="" /> : <span>{(user.steamLogin || "U")[0]}</span>}
            </div>
            <div className="mob__profile-info">
              <span className="mob__name">{user.steamLogin || "User"}</span>
              <span className="mob__bal">{format(Number(user.balance ?? 0))}</span>
            </div>
          </div>
        )}

        <div className="mob__prefs">
          <div className="mob__pill-group">
            {(["USD", "EUR", "RUB"] as const).map(c => (
              <button key={c} className={`mob__pill${currency === c ? " mob__pill--on" : ""}`} onClick={() => handleCurrency(c)}>{c}</button>
            ))}
          </div>
          <div className="mob__pill-group">
            <button className={`mob__pill${lang === "EN" ? " mob__pill--on" : ""}`} onClick={() => handleLang("EN")}>EN</button>
            <button className={`mob__pill${lang === "RU" ? " mob__pill--on" : ""}`} onClick={() => handleLang("RU")}>RU</button>
          </div>
        </div>

        <div className="mob__line" />

        <div className="mob__nav">
          {!loading && user && (
            <>
              <Link href="/sell" className="mob__item" onClick={() => setMobileOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                {t("sellSkins")}
              </Link>
              <Link href="/balance" className="mob__item" onClick={() => setMobileOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
                {t("menuBalance")}
              </Link>
              <Link href="/orders" className="mob__item" onClick={() => setMobileOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                {t("menuOrders")}
              </Link>
              <Link href="/referral" className="mob__item" onClick={() => setMobileOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {t("menuReferral")}
              </Link>

              <div className="mob__line" />

              <Link href="/#reviews" className="mob__item" onClick={() => setMobileOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {t("reviews")}
              </Link>
              <Link href="/faq" className="mob__item" onClick={() => setMobileOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>
                {t("faq")}
              </Link>

              {user.isAdmin && (
                <NextLink href="/admin" className="mob__item" onClick={() => setMobileOpen(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  {t("admin")}
                </NextLink>
              )}

              <div className="mob__line" />

              <a href="/api/auth/logout" className="mob__item mob__item--danger" onClick={() => setMobileOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                {t("menuLogout")}
              </a>
            </>
          )}

          {!loading && !user && (
            <a href="/api/auth/steam" className="mob__steam" onClick={() => setMobileOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-9.96 9.04l5.35 2.21a2.83 2.83 0 0 1 1.6-.49c.05 0 .1 0 .16.01l2.4-3.47v-.05a3.77 3.77 0 0 1 3.77-3.77 3.77 3.77 0 0 1 3.77 3.77 3.77 3.77 0 0 1-3.77 3.77h-.09l-3.41 2.44c0 .04.01.09.01.13a2.84 2.84 0 0 1-2.84 2.84 2.85 2.85 0 0 1-2.8-2.37L2.2 12.9A10 10 0 1 0 12 2z"/></svg>
              {t("signIn")}
            </a>
          )}
        </div>
      </div>
      <div className={`avatar-menu-backdrop${avatarMenuOpen ? " active" : ""}`} onClick={() => setAvatarMenuOpen(false)} />
      {!loading && user && (
        <div className={`avatar-menu${avatarMenuOpen ? " active" : ""}`}>
          <div className="avatar-menu__head">
            <div className="avatar-menu__ava">
              {user.steamAvatar ? <img src={user.steamAvatar} alt="Avatar" /> : <span>{(user.steamLogin || "U")[0].toUpperCase()}</span>}
            </div>
            <div className="avatar-menu__info">
              <span className="avatar-menu__name">{user.steamLogin || "User"}</span>
              <span className="avatar-menu__id">steamcommunity.com/id/{user.steamLogin || "user"}</span>
            </div>
          </div>
          <div className="avatar-menu__sep"></div>
          <Link href="/orders" className="avatar-menu__item" onClick={() => setAvatarMenuOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            <span>{t("menuOrders")}</span>
          </Link>
          <Link href="/balance" className="avatar-menu__item" onClick={() => setAvatarMenuOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
            <span>{t("menuBalance")}</span>
          </Link>
          <Link href="/referral" className="avatar-menu__item" onClick={() => setAvatarMenuOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>{t("menuReferral")}</span>
          </Link>
          <Link href="/faq" className="avatar-menu__item" onClick={() => setAvatarMenuOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>
            <span>{t("menuSupport")}</span>
          </Link>
          <div className="avatar-menu__sep"></div>
          {user.isAdmin && (
            <NextLink href="/admin" className="avatar-menu__item" onClick={() => setAvatarMenuOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>{t("admin")}</span>
            </NextLink>
          )}
          <a href="/api/auth/logout" className="avatar-menu__item avatar-menu__item--logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>{t("menuLogout")}</span>
          </a>
        </div>
      )}
    </>
  );
}
