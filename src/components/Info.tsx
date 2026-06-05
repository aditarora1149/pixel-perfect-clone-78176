import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getEdu } from "@/lib/education";

export function Info({ k }: { k: string }) {
  const e = getEdu(k);
  if (!e) return null;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex items-center text-muted-foreground/60 hover:text-primary">
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground border border-border">
          <div className="space-y-1.5">
            <div className="font-semibold text-xs">{e.term}</div>
            <div className="text-xs opacity-90">{e.definition}</div>
            <div className="text-[10px] opacity-70"><span className="font-semibold">Example: </span>{e.example}</div>
            <div className="text-[10px] opacity-90 text-primary"><span className="font-semibold">Why it matters: </span>{e.takeaway}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
