"use client";

import { useState, useEffect, useRef } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState(() => currentLocale === "ru" ? "RU" : "EN");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const currencyRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (avatarMenuOpen) {
      document.body.classList.add("avatar-blur");
    } else {
      document.body.classList.remove("avatar-blur");
    }
    return () => document.body.classList.remove("avatar-blur");
  }, [avatarMenuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
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
        <div className="header__inner">
          <div className="header__left">
            <Link href="/" className="header__logo">
              <span className="header__logo-text">SKINWAVE</span>
            </Link>
          </div>

          <nav className={`header__nav${mobileOpen ? " open" : ""}`}>
            <Link href="/sell" className={isActive("/sell") ? "active" : ""} onClick={() => setMobileOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> {t("sellSkins")}
            </Link>
            <Link href="/#reviews" onClick={() => setMobileOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> {t("reviews")}
            </Link>
            <Link href="/faq" className={isActive("/faq") ? "active" : ""} onClick={() => setMobileOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg> {t("faq")}
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
                <span>{lang}</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="header__dropdown">
                <button className={`header__dropdown-item${lang === "EN" ? " is-active" : ""}`} onClick={() => handleLang("EN")}>English</button>
                <button className={`header__dropdown-item${lang === "RU" ? " is-active" : ""}`} onClick={() => handleLang("RU")}>Русский</button>
              </div>
            </div>
            <div className="header__divider"></div>

            {!loading && !user && (
              <a href="/api/auth/steam" className="header__login-btn">
                <span>{t("signIn")}</span>
              </a>
            )}

            {!loading && user && (
              <div className="header__user">
                <Link href="/balance" className="header__balance">{format(Number(user.balance ?? 0))}</Link>
                <div className="header__avatar-wrap" onClick={() => setAvatarMenuOpen(!avatarMenuOpen)} style={{ cursor: "pointer" }}>
                  <div className="header__avatar">
                    {user.steamAvatar ? <img src={user.steamAvatar} alt="Avatar" /> : <span>{(user.steamLogin || "U")[0].toUpperCase()}</span>}
                  </div>
                  <span className="header__avatar-dot"></span>
                </div>
              </div>
            )}

            <button className={`header__burger${mobileOpen ? " is-open" : ""}`} aria-label="Menu" onClick={() => setMobileOpen(!mobileOpen)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
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
