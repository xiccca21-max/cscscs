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
        disclaimer: "© 2026 SKINWAVE. Not affiliated with Valve Corp.",
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
            <span className="footer__brand-name">SKINWAVE</span>
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
          <div className="footer__socials">
            {socialLinks.discord && (
              <a href={socialLinks.discord} aria-label="Discord" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              </a>
            )}
            {socialLinks.twitter && (
              <a href={socialLinks.twitter} aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
            {socialLinks.steam_group && (
              <a href={socialLinks.steam_group} aria-label="Steam" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
              </a>
            )}
            {socialLinks.telegram && (
              <a href={socialLinks.telegram} aria-label="Telegram" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            )}
            {!socialLinks.discord && !socialLinks.twitter && !socialLinks.steam_group && !socialLinks.telegram && (
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
