import Link from "next/link";
import { Sparkle, ArrowLeft } from "./icons";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({
  right,
  back,
}: {
  right?: React.ReactNode;
  back?: { href: string; label?: string };
}) {
  return (
    <nav className="navbar">
      <div className="row" style={{ gap: "1rem" }}>
        <Link href="/" className="brand">
          <span className="brand-logo"><Sparkle size={17} /></span>
          <span>Profe Nacho</span>
        </Link>
        {back && (
          <>
            <span className="nav-divider" aria-hidden />
            <Link href={back.href} className="back-link">
              <ArrowLeft size={16} />
              {back.label ?? "Volver"}
            </Link>
          </>
        )}
      </div>
      <div className="row" style={{ gap: "0.6rem" }}>
        {right}
        <ThemeToggle />
      </div>
    </nav>
  );
}
