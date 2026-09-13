"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { siteMenus } from "@/components/site-navigation";

export function DesktopNav() {
  const [openMenu, setOpenMenu] = useState<string>();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node))
        setOpenMenu(undefined);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  return (
    <nav
      ref={navRef}
      className="hidden items-center gap-1 rounded-full border bg-card/70 p-1 text-xs md:flex"
      aria-label="Primary"
    >
      {siteMenus.map((menu) => {
        const id = `nav-menu-${menu.label.toLowerCase()}`;
        const open = openMenu === menu.label;
        return (
          <div key={menu.label} className="nav-menu relative">
            <button
              aria-controls={id}
              aria-expanded={open}
              className="flex items-center gap-1 rounded-full px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60"
              onClick={() => setOpenMenu(open ? undefined : menu.label)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setOpenMenu(undefined);
                  event.currentTarget.focus();
                }
              }}
            >
              {menu.label}
              <ChevronDown
                className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
            <div id={id} className="nav-menu-panel" data-open={open}>
              <div className="rounded-lg border bg-popover p-2 shadow-2xl">
                {menu.items.map(([label, desc, href, Icon]) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex gap-3 rounded-md p-3 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/60"
                    onClick={() => setOpenMenu(undefined)}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-background text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span>
                      <strong className="block text-xs font-medium text-foreground">
                        {label}
                      </strong>
                      <small className="mt-1 block text-xs leading-4 text-muted-foreground">
                        {desc}
                      </small>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <Link
        className="rounded-full px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60"
        href="/infra"
      >
        Documentation
      </Link>
    </nav>
  );
}
