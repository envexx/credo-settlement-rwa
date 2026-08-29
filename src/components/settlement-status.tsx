import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SettlementPresentation } from "@/lib/settlement-presentation";

export function SettlementStatus({ copy }: { copy: SettlementPresentation }) {
  return (
    <Alert data-tone={copy.tone}>
      <div aria-live="polite" aria-atomic="true">
        <AlertTitle>{copy.title}</AlertTitle>
        <AlertDescription>{copy.body}</AlertDescription>
      </div>
      <p className="mt-3 text-xs font-medium">Next: {copy.nextAction}</p>
    </Alert>
  );
}
