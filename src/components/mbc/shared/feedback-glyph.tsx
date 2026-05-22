import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import type { Feedback } from "../logic/types";

export function FeedbackGlyph({ tone }: { tone: Feedback["tone"] }) {
  if (tone === "success") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (tone === "error") {
    return <AlertTriangle className="h-4 w-4" />;
  }

  return <Info className="h-4 w-4" />;
}
