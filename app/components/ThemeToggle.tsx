"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "./icons";

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage puede fallar en modo privado */
    }
  }

  const esDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      className="btn btn-ghost btn-sm theme-toggle"
      aria-label={esDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={esDark ? "Modo claro" : "Modo oscuro"}
      suppressHydrationWarning
    >
      {/* Antes de montar, mostramos un placeholder neutro para evitar mismatch */}
      {mounted ? (esDark ? <Sun size={17} /> : <Moon size={17} />) : <Sun size={17} />}
    </button>
  );
}
