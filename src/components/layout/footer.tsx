"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "/en" || pathname === "/ru";

  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch("/api/settings/social-links")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setSocialLinks(d.data); })
      .catch(() => {});
  }, []);

  let t: (key: string) => string;
  try {
    t = useTranslations("footer");
  } catch {
    t = (key: string) => {
      const fallback: Record<string, string> = {
        ctaTitle: "Ready to sell your skins?",
        ctaSubtitle: "Get the best prices for your CS2, Dota 2, TF2 and Rust items.",
        ctaButton: "Start Selling",
        brandTagline: "Instant skin buyout service. Sell your CS2, Dota 2, TF2 and Rust skins for real money.",
        colServices: "Services",
        colGames: "Games",
        colSupport: "Support",
        sellLink: "Sell Skins",
        faqLink: "FAQ",
        gameCs2: "Counter-Strike 2",
        gameDota: "Dota 2",
        gameTf2: "Team Fortress 2",
        gameRust: "Rust",
        helpCenter: "Help Center",
        contact: "Contact Us",
        disclaimer: "© 2026 SKINSELL. Not affiliated with Valve Corp.",
      };
      return fallback[key] || key;
    };
  }

  return (
    <footer className="footer">
      <div className="footer__inner">
        {isHome && (
          <div className="footer__cta-bar">
            <div className="footer__cta-text">
              <h3>{t("ctaTitle")}</h3>
              <p>{t("ctaSubtitle")}</p>
            </div>
            <Link href="/sell" className="footer__cta-btn">{t("ctaButton")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></Link>
          </div>
        )}
        <div className="footer__grid">
          <div className="footer__brand">
            <span className="footer__brand-name">SKINSELL</span>
            <p>{t("brandTagline")}</p>
          </div>
          <div className="footer__col">
            <h4>{t("colServices")}</h4>
            <Link href="/sell">{t("sellLink")}</Link>
            <Link href="/faq">{t("faqLink")}</Link>
          </div>
          <div className="footer__col">
            <h4>{t("colGames")}</h4>
            <Link href="/sell">{t("gameCs2")}</Link>
            <Link href="/sell">{t("gameDota")}</Link>
            <Link href="/sell">{t("gameTf2")}</Link>
            <Link href="/sell">{t("gameRust")}</Link>
          </div>
          <div className="footer__col">
            <h4>{t("colSupport")}</h4>
            <Link href="/faq">{t("helpCenter")}</Link>
            <a href={socialLinks.contact_email ? `mailto:${socialLinks.contact_email}` : "/faq"} target={socialLinks.contact_email ? "_blank" : undefined} rel={socialLinks.contact_email ? "noopener" : undefined}>{t("contact")}</a>
          </div>
        </div>
        <div className="footer__bottom">
          <span>{t("disclaimer")}</span>
          <a href="https://www.trustpilot.com/review/skinsell.com" target="_blank" rel="noopener noreferrer" className="footer__trustpilot">
            <img src="/trustpilot.png" alt="Trustpilot" width="16" height="16" />
            <strong>4.2</strong> Trustpilot
          </a>
          <div className="footer__socials">
            {socialLinks.twitter && (
              <a href={socialLinks.twitter} aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
            {socialLinks.steam_group && (
              <a href={socialLinks.steam_group} aria-label="Steam" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/></svg>
              </a>
            )}
            {socialLinks.telegram && (
              <a href={socialLinks.telegram} aria-label="Telegram" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            )}
            {!socialLinks.twitter && !socialLinks.steam_group && !socialLinks.telegram && (
              <>
                <span style={{ opacity: 0.5, fontSize: 12 }}>Social links not configured</span>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
