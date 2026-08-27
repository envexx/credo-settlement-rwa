"use client";

import { useEffect, useState } from "react";
import { BookOpenText, ExternalLink, PlayCircle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export type DocsSectionGroup = {
  group: string;
  links: readonly (readonly [string, string])[];
};

export function DocsSidebar({ sections }: { sections: DocsSectionGroup[] }) {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries.find((entry) => entry.isIntersecting);
        if (current?.target.id) setActive(current.target.id);
      },
      { rootMargin: "-18% 0px -68%" },
    );
    const ids = sections.flatMap((section) =>
      section.links.map(([, id]) => id),
    );
    ids.forEach((id) => {
      const target = document.getElementById(id);
      if (target) observer.observe(target);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <TooltipProvider>
      <Sidebar collapsible="offcanvas" variant="sidebar">
        <SidebarHeader className="border-b px-4 py-5">
          <a href="#overview" className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-md border bg-background text-primary">
              <BookOpenText className="size-4" />
            </span>
            <span>
              <strong className="block text-sm font-semibold">
                Credo Docs
              </strong>
              <span className="text-xs text-muted-foreground">
                Protocol reference
              </span>
            </span>
          </a>
        </SidebarHeader>
        <SidebarContent className="px-2 py-4">
          {sections.map((section) => (
            <SidebarGroup key={section.group}>
              <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.links.map(([label, id]) => (
                    <DocsNavLink
                      active={active === id}
                      id={id}
                      key={id}
                      label={label}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/playground">
                  <PlayCircle />
                  <span>Run live settlement</span>
                  <ExternalLink className="ml-auto" />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}

function DocsNavLink({
  active,
  id,
  label,
}: {
  active: boolean;
  id: string;
  label: string;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <a
          href={`#${id}`}
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        >
          <span>{label}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function DocsMobileTrigger() {
  return (
    <SidebarTrigger
      className="md:hidden"
      aria-label="Open documentation navigation"
    />
  );
}
