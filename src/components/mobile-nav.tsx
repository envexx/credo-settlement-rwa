"use client";

import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteMenus } from "@/components/site-navigation";

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="min-h-11 min-w-11 md:hidden"
          aria-label="Open primary navigation"
        >
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(88vw,360px)]">
        <SheetHeader className="border-b">
          <SheetTitle>Explore Credo</SheetTitle>
          <SheetDescription>
            Product, evidence, documentation, and live settlement.
          </SheetDescription>
        </SheetHeader>
        <nav
          className="flex-1 overflow-y-auto px-4 pb-6"
          aria-label="Mobile primary"
        >
          {siteMenus.map((menu) => (
            <section className="mt-6" key={menu.label}>
              <h2 className="technical-label">{menu.label}</h2>
              <div className="mt-2 space-y-1">
                {menu.items.map(([label, description, href, Icon]) => (
                  <SheetClose asChild key={label}>
                    <Link
                      href={href}
                      className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon className="size-4 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <strong className="block text-sm font-medium">
                          {label}
                        </strong>
                        <small className="block text-xs leading-5 text-muted-foreground">
                          {description}
                        </small>
                      </span>
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </section>
          ))}
          <div className="mt-6 grid gap-2 border-t pt-5">
            <SheetClose asChild>
              <Button asChild variant="outline" className="min-h-11">
                <Link href="/infra">Documentation</Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button asChild className="min-h-11">
                <Link href="/playground">
                  Open Playground <ArrowRight />
                </Link>
              </Button>
            </SheetClose>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
