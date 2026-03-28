"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Category = "all" | "general" | "payments" | "security" | "trading" | "cs2";

interface FaqItem {
  cat: Exclude<Category, "all">;
  qKey: string;
  aKey: string;
}

const FAQ_KEYS: FaqItem[] = [
  { cat: "general", qKey: "g1q", aKey: "g1a" },
  { cat: "general", qKey: "g2q", aKey: "g2a" },
  { cat: "general", qKey: "g3q", aKey: "g3a" },
  { cat: "general", qKey: "g4q", aKey: "g4a" },
  { cat: "general", qKey: "g5q", aKey: "g5a" },
  { cat: "general", qKey: "g6q", aKey: "g6a" },
  { cat: "payments", qKey: "p1q", aKey: "p1a" },
  { cat: "payments", qKey: "p2q", aKey: "p2a" },
  { cat: "payments", qKey: "p3q", aKey: "p3a" },
  { cat: "payments", qKey: "p4q", aKey: "p4a" },
  { cat: "payments", qKey: "p5q", aKey: "p5a" },
  { cat: "payments", qKey: "p6q", aKey: "p6a" },
  { cat: "payments", qKey: "p7q", aKey: "p7a" },
  { cat: "security", qKey: "s1q", aKey: "s1a" },
  { cat: "security", qKey: "s2q", aKey: "s2a" },
  { cat: "trading", qKey: "t1q", aKey: "t1a" },
  { cat: "trading", qKey: "t2q", aKey: "t2a" },
  { cat: "trading", qKey: "t3q", aKey: "t3a" },
  { cat: "trading", qKey: "t4q", aKey: "t4a" },
  { cat: "cs2", qKey: "c1q", aKey: "c1a" },
  { cat: "cs2", qKey: "c2q", aKey: "c2a" },
  { cat: "cs2", qKey: "c3q", aKey: "c3a" },
  { cat: "cs2", qKey: "c4q", aKey: "c4a" },
];

const SECTION_KEYS: { key: Exclude<Category, "all">; labelKey: string; count: number }[] = [
  { key: "general", labelKey: "catGeneral", count: 6 },
  { key: "payments", labelKey: "catPayments", count: 7 },
  { key: "security", labelKey: "catSecurity", count: 2 },
  { key: "trading", labelKey: "catTrading", count: 4 },
  { key: "cs2", labelKey: "catCs2", count: 4 },
];

export default function FaqPage() {
  const t = useTranslations("faq");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<Category>("all");
  const [openItem, setOpenItem] = useState<string | null>(null);

  const faqItems = useMemo(
    () =>
      FAQ_KEYS.map((item) => ({
        cat: item.cat,
        q: t(item.qKey as Parameters<typeof t>[0]),
        a: t(item.aKey as Parameters<typeof t>[0]),
        key: `${item.cat}-${item.qKey}`,
      })),
    [t],
  );

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return faqItems.filter((item) => {
      const matchesCat = activeCat === "all" || item.cat === activeCat;
      const matchesSearch =
        !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [search, activeCat, faqItems]);

  const sections = SECTION_KEYS.map((sec) => ({
    ...sec,
    label: t(sec.labelKey as Parameters<typeof t>[0]),
  }));

  const visibleSections = sections.filter((sec) =>
    filteredItems.some((item) => item.cat === sec.key)
  );

  const toggleItem = (key: string) => {
    setOpenItem((prev) => (prev === key ? null : key));
  };

  return (
    <main className="fq">
      <section className="fq-hero">
        <div className="fq-hero__bg" />
        <div className="fq-hero__content">
          <span className="fq-hero__label">{t("heroLabel")}</span>
          <h1 className="fq-hero__title">{t("heroTitle1")} <span>{t("heroTitle2")}</span></h1>
          <p className="fq-hero__sub">{t("heroSub")}</p>
          <div className="fq-search">
            <svg className="fq-search__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="text"
              className="fq-search__input"
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="fq-layout">
        <div className="fq-layout__inner">

          <aside className="fq-sidebar">
            <h3 className="fq-sidebar__title">{t("sidebar")}</h3>
            <nav className="fq-cats">
              <button
                className={`fq-cat${activeCat === "all" ? " active" : ""}`}
                onClick={() => setActiveCat("all")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                <span className="fq-cat__text">{t("catAll")}</span>
              </button>
              <button
                className={`fq-cat${activeCat === "general" ? " active" : ""}`}
                onClick={() => setActiveCat("general")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                <span className="fq-cat__text">{t("catGeneral")}</span>
                <span className="fq-cat__count">6</span>
              </button>
              <button
                className={`fq-cat${activeCat === "payments" ? " active" : ""}`}
                onClick={() => setActiveCat("payments")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                <span className="fq-cat__text">{t("catPayments")}</span>
                <span className="fq-cat__count">7</span>
              </button>
              <button
                className={`fq-cat${activeCat === "security" ? " active" : ""}`}
                onClick={() => setActiveCat("security")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <span className="fq-cat__text">{t("catSecurity")}</span>
                <span className="fq-cat__count">2</span>
              </button>
              <button
                className={`fq-cat${activeCat === "trading" ? " active" : ""}`}
                onClick={() => setActiveCat("trading")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                <span className="fq-cat__text">{t("catTrading")}</span>
                <span className="fq-cat__count">4</span>
              </button>
              <button
                className={`fq-cat${activeCat === "cs2" ? " active" : ""}`}
                onClick={() => setActiveCat("cs2")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><line x1="12" y1="3" x2="12" y2="7" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="3" y1="12" x2="7" y2="12" /><line x1="17" y1="12" x2="21" y2="12" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></svg>
                <span className="fq-cat__text">{t("catCs2")}</span>
                <span className="fq-cat__count">4</span>
              </button>
            </nav>
          </aside>

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
                    <span className="fq-section__count">{sec.count} {t("questions")}</span>
                  </div>
                  <div className="fq-section__items">
                    {sectionItems.map((item) => {
                      const isOpen = openItem === item.key;
                      return (
                        <div className={`fq-item${isOpen ? " open" : ""}`} data-cat={item.cat} key={item.key}>
                          <button
                            className="fq-item__q"
                            aria-expanded={isOpen}
                            onClick={() => toggleItem(item.key)}
                          >
                            <span>{item.q}</span>
                            <svg className="fq-item__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                          </button>
                          <div className="fq-item__a">
                            <p>{item.a}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="fq-cta">
              <div className="fq-cta__inner">
                <h2>{t("heroTitle1")} <span>{t("heroTitle2")}</span></h2>
                <p>{t("heroSub")}</p>
                <div className="fq-cta__cards fq-cta__cards--single">
                  <div className="fq-cta__card">
                    <h3>{t("catCs2")}</h3>
                    <p>{t("c2a")}</p>
                    <Link href="/sell" className="fq-cta__btn">{t("catCs2")}</Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
