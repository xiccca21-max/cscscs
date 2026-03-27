"use client";

import { useState, useEffect, useMemo } from "react";
import { Link } from "@/i18n/navigation";

type Category = "all" | "general" | "payments" | "security" | "trading" | "cs2";

interface FaqItem {
  cat: Category;
  q: string;
  a: string;
}

const FAQ_DATA: FaqItem[] = [
  { cat: "general", q: "What is SKINWAVE?", a: "SKINWAVE is an instant CS2 skin buyout service. We buy your Counter-Strike 2 skins directly for real money — no waiting for buyers, no auctions. Get paid via card, crypto, bank transfer or site balance." },
  { cat: "general", q: "Is SKINWAVE legit?", a: "Yes. We use Steam's official OpenID authentication — we never ask for your password. All trades go through Steam's trading system. Your order status is tracked in real time and all operations are logged." },
  { cat: "general", q: "How do I log in?", a: "Click \"Sign In\" in the top right corner. You'll be redirected to Steam's official login page. After logging in, you'll be returned to SKINWAVE with your account connected. We never see or store your Steam password." },
  { cat: "general", q: "How does selling skins work?", a: "Select your skins on the Sell page, choose a payout method, and confirm. We send you a trade offer via Steam. Once you accept, payment is processed instantly (or after trade hold ends). No marketplace listing, no waiting for buyers." },
  { cat: "general", q: "How does SKINWAVE price skins?", a: "Prices are based on current market data with our buyout modifier applied. You typically receive up to 95% of market value. Prices are displayed in your chosen currency and updated regularly." },
  { cat: "general", q: "Our Official Bot List", a: "Always verify that trade offers come from our official bots. If a trade offer comes from an account not on our bot list, do not accept it. Contact support if you are unsure." },
  { cat: "payments", q: "How can I deposit funds?", a: "You can deposit funds to your SKINWAVE balance by selling skins. Choose \"Balance\" as your payout method when selling — this has 0% commission. The funds are instantly available in your account." },
  { cat: "payments", q: "How can I withdraw my balance?", a: "Go to your Balance page, click \"Cash Out\", choose a withdrawal method (card, crypto, bank), enter the amount and your details. Your withdrawal request will be processed by our team." },
  { cat: "payments", q: "How do Card payouts work?", a: "Card payouts are sent directly to your Visa or Mastercard. Enter your card details when choosing this method. Processing time is usually 1–3 business days depending on your bank. Fee: ~3%." },
  { cat: "payments", q: "How do Bank payouts work?", a: "Bank transfer payouts are sent directly to your bank account. Provide your bank details (IBAN or account number). Processing takes 2–5 business days. Fee: ~2%." },
  { cat: "payments", q: "How do crypto payouts work?", a: "Choose crypto as your payout method and enter your wallet address (Bitcoin or USDT). Payment is sent after we receive your items. Crypto transactions typically process within 10–30 minutes. Fee: ~1%." },
  { cat: "payments", q: "What payout methods are available?", a: "We offer Balance (0% fee), Debit Card (Visa/Mastercard), Cryptocurrency (Bitcoin, USDT), and Bank Transfer. Available methods may vary by region." },
  { cat: "payments", q: "Are there any fees?", a: "Each method has its own commission: Balance 0%, Crypto ~1%, Bank ~2%, Card ~3%. The exact fee is always shown before you confirm your order." },
  { cat: "security", q: "How can I secure my account?", a: "Enable Steam Guard Mobile Authenticator. Never share your Trade URL publicly and regenerate it if compromised. We will never ask for your Steam password or login credentials." },
  { cat: "security", q: "How do I avoid scams when selling skins?", a: "Always verify trade offers come from our official bots. Never click suspicious links or share your API key. SKINWAVE will never ask you to send items without a proper trade offer through Steam." },
  { cat: "trading", q: "What is a Trade URL?", a: "A Trade URL is a unique link that allows us to send you a Steam trade offer. You need to provide it before selling. Find yours at: Steam → Settings → Privacy → Trade Offers → Copy your Trade URL." },
  { cat: "trading", q: "Why are items missing from my inventory?", a: "Make sure your Steam inventory is set to Public. Go to Steam → Profile → Edit Profile → Privacy Settings → set \"Inventory\" to \"Public\". Also check that items are not on trade hold or listed on another marketplace." },
  { cat: "trading", q: "Items are missing after I sold them?", a: "If items disappeared from your inventory after selling, the trade was completed successfully. Check your order status on the Orders page. If payment hasn't arrived, wait a few minutes — some methods take time to process. Contact support with your Order ID if the issue persists." },
  { cat: "trading", q: "What is a reversal hold?", a: "A reversal hold occurs when Steam reverses a trade due to a dispute or suspected fraud. If this happens, the items are returned and any associated payout may be reversed. Contact support for assistance." },
  { cat: "cs2", q: "What are CS2 Skins?", a: "CS2 skins are virtual cosmetic items for weapons in Counter-Strike 2. They come in various rarities and wear conditions (Factory New, Minimal Wear, Field-Tested, Well-Worn, Battle-Scarred). You can sell them on SKINWAVE for real money." },
  { cat: "cs2", q: "How do I sell CS2 Skins?", a: "Sign in via Steam, go to the Sell page. Pick your CS2 skins, enter your Trade URL, choose a payout method and confirm. Accept the trade offer from our bot in Steam and receive your payout instantly." },
  { cat: "cs2", q: "What is the CS2 trade hold?", a: "CS2 items may have a 7-day Steam trade hold. Payment for items under trade hold is processed after the hold period ends and the items are received by our system. Enable Steam Guard Mobile Authenticator to reduce or remove the hold." },
  { cat: "cs2", q: "How does selling CS2 Skins work on SKINWAVE?", a: "You sell your CS2 skins by accepting a trade offer from our bot. Make sure Steam Guard is enabled, your inventory is set to public, and your Trade URL is up to date. We buy your skins directly — no marketplace, no waiting for other buyers." },
];

const SECTIONS: { key: Exclude<Category, "all">; label: string; count: number }[] = [
  { key: "general", label: "General", count: 6 },
  { key: "payments", label: "Payments", count: 7 },
  { key: "security", label: "Security", count: 2 },
  { key: "trading", label: "Selling Process", count: 4 },
  { key: "cs2", label: "CS2", count: 4 },
];

export default function FaqPage() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<Category>("all");
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    document.body.classList.add("faq-body");
    fetch("/api/settings/social-links")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setSocialLinks(d.data); })
      .catch(() => {});
    return () => {
      document.body.classList.remove("faq-body");
    };
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return FAQ_DATA.filter((item) => {
      const matchesCat = activeCat === "all" || item.cat === activeCat;
      const matchesSearch =
        !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [search, activeCat]);

  const visibleSections = SECTIONS.filter((sec) =>
    filteredItems.some((item) => item.cat === sec.key)
  );

  const toggleItem = (key: string) => {
    setOpenItem((prev) => (prev === key ? null : key));
  };

  return (
    <main className="fq">
      {/* Hero */}
      <section className="fq-hero">
        <div className="fq-hero__bg" />
        <div className="fq-hero__content">
          <span className="fq-hero__label">Help Center</span>
          <h1 className="fq-hero__title">How can we <span>help you?</span></h1>
          <p className="fq-hero__sub">Browse our knowledge base or search for a topic below.</p>
          <div className="fq-search">
            <svg className="fq-search__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="text"
              className="fq-search__input"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Category bar + FAQ content */}
      <div className="fq-layout">
        <div className="fq-layout__inner">

          {/* Sidebar / Category filters */}
          <aside className="fq-sidebar">
            <h3 className="fq-sidebar__title">Frequently Asked Questions</h3>
            <nav className="fq-cats">
              <button
                className={`fq-cat${activeCat === "all" ? " active" : ""}`}
                onClick={() => setActiveCat("all")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                <span className="fq-cat__text">All</span>
              </button>
              <button
                className={`fq-cat${activeCat === "general" ? " active" : ""}`}
                onClick={() => setActiveCat("general")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                <span className="fq-cat__text">General</span>
                <span className="fq-cat__count">6</span>
              </button>
              <button
                className={`fq-cat${activeCat === "payments" ? " active" : ""}`}
                onClick={() => setActiveCat("payments")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                <span className="fq-cat__text">Payments</span>
                <span className="fq-cat__count">7</span>
              </button>
              <button
                className={`fq-cat${activeCat === "security" ? " active" : ""}`}
                onClick={() => setActiveCat("security")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <span className="fq-cat__text">Security</span>
                <span className="fq-cat__count">2</span>
              </button>
              <button
                className={`fq-cat${activeCat === "trading" ? " active" : ""}`}
                onClick={() => setActiveCat("trading")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                <span className="fq-cat__text">Selling Process</span>
                <span className="fq-cat__count">4</span>
              </button>
              <button
                className={`fq-cat${activeCat === "cs2" ? " active" : ""}`}
                onClick={() => setActiveCat("cs2")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><line x1="12" y1="3" x2="12" y2="7" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="3" y1="12" x2="7" y2="12" /><line x1="17" y1="12" x2="21" y2="12" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></svg>
                <span className="fq-cat__text">CS2</span>
                <span className="fq-cat__count">4</span>
              </button>
            </nav>
          </aside>

          {/* FAQ content */}
          <div className="fq-content">

            {visibleSections.map((sec) => {
              const sectionItems = filteredItems.filter((item) => item.cat === sec.key);
              if (sectionItems.length === 0) return null;

              const sectionIcon = (() => {
                switch (sec.key) {
                  case "general":
                    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
                  case "payments":
                    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
                  case "security":
                    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
                  case "trading":
                    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
                  case "cs2":
                    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><line x1="12" y1="3" x2="12" y2="7" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="3" y1="12" x2="7" y2="12" /><line x1="17" y1="12" x2="21" y2="12" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></svg>;
                }
              })();

              return (
                <div className="fq-section" data-section={sec.key} key={sec.key}>
                  <div className="fq-section__head">
                    {sectionIcon}
                    <h2>{sec.label}</h2>
                    <span className="fq-section__count">{sec.count} questions</span>
                  </div>
                  <div className="fq-section__items">
                    {sectionItems.map((item) => {
                      const key = `${item.cat}-${item.q}`;
                      const isOpen = openItem === key;
                      return (
                        <div className="fq-item" data-cat={item.cat} key={key}>
                          <button
                            className="fq-item__q"
                            aria-expanded={isOpen}
                            onClick={() => toggleItem(key)}
                          >
                            <span>{item.q}</span>
                            <svg className="fq-item__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                          </button>
                          <div className="fq-item__a" style={{ display: isOpen ? "block" : "none" }}>
                            <p>{item.a}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* CTA */}
            <div className="fq-cta">
              <div className="fq-cta__inner">
                <h2>Ready to Sell Your <span>Skins?</span></h2>
                <p>Instant payouts via card, Bitcoin, bank transfer and more. Join 10K+ registered users already being paid.</p>
                <div className="fq-cta__cards fq-cta__cards--single">
                  <div className="fq-cta__card">
                    <h3>Sell CS2 Skins</h3>
                    <p>Skip the 7-day trade hold. Sell your CS2 skins for real money instantly. Multiple payout methods available.</p>
                    <Link href="/sell" className="fq-cta__btn">Sell CS2 Skins</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="fq-contact">
              <h3>Still have questions?</h3>
              <p>Our support team is available 24/7 to help you</p>
              <div className="fq-contact__grid">
                <a href={socialLinks.discord || "#"} className="fq-contact__card fq-contact__card--discord" target={socialLinks.discord ? "_blank" : undefined} rel={socialLinks.discord ? "noopener noreferrer" : undefined}>
                  <div className="fq-contact__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
                  </div>
                  <div className="fq-contact__text">
                    <strong>Join Discord</strong>
                    <span>Get instant help from our community</span>
                  </div>
                  <svg className="fq-contact__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </a>
                <a href={socialLinks.contact_email ? `mailto:${socialLinks.contact_email}` : "#"} className="fq-contact__card fq-contact__card--email" target={socialLinks.contact_email ? "_blank" : undefined} rel={socialLinks.contact_email ? "noopener noreferrer" : undefined}>
                  <div className="fq-contact__icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  </div>
                  <div className="fq-contact__text">
                    <strong>Email Support</strong>
                    <span>We reply within a few hours</span>
                  </div>
                  <svg className="fq-contact__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
