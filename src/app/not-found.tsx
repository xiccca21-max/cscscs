import Link from "next/link";
import "@/styles/skinwave-base.css";

export default function NotFoundPage() {
  return (
    <main className="e404">
      <style>{`
        .e404 {
          min-height: calc(100vh - var(--header-h, 72px));
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          background: linear-gradient(180deg, #f8f9fb 0%, #eeeef4 100%);
        }
        .e404__inner { max-width: 480px; }
        .e404__code {
          font-size: 120px;
          font-weight: 900;
          background: linear-gradient(135deg, #4338ca, #6366f1, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: 8px;
        }
        .e404__title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
        }
        .e404__desc {
          font-size: 15px;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .e404__btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          border-radius: 12px;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
        }
        .e404__btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(99,102,241,0.4);
        }
        .e404__links {
          margin-top: 24px;
          display: flex;
          justify-content: center;
          gap: 24px;
        }
        .e404__links a {
          font-size: 13px;
          font-weight: 600;
          color: #6366f1;
          text-decoration: none;
        }
        .e404__links a:hover { text-decoration: underline; }
      `}</style>
      <div className="e404__inner">
        <div className="e404__code">404</div>
        <h1 className="e404__title">Page Not Found</h1>
        <p className="e404__desc">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>
        <Link href="/" className="e404__btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to Home
        </Link>
        <div className="e404__links">
          <Link href="/sell">Sell Skins</Link>
          <Link href="/faq">FAQ</Link>
        </div>
      </div>
    </main>
  );
}
