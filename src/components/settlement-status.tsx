import type { SettlementPresentation } from "@/lib/settlement-presentation";

export function SettlementStatus({ copy }: { copy: SettlementPresentation }) {
  return (
    <section data-tone={copy.tone} aria-labelledby="settlement-status-title">
      <h3 id="settlement-status-title" className="font-medium">
        {copy.title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
      <p className="mt-3 text-xs font-medium">Next: {copy.nextAction}</p>
    </section>
  );
}
