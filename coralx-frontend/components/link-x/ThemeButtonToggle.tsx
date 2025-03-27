"use client";
import { useEffect, useState } from "react";

export default function ThemeButtonToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    if (theme === "dark") {
      root.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="mt-2 px-4 py-2 border border-border rounded text-sm text-muted-foreground hover:bg-muted transition-colors"
    >
      Switch to {theme === "dark" ? "Light" : "Dark"} Mode
    </button>
  );
}

