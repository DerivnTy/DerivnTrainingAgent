import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, X } from "lucide-react";

const PDF_URL = "/pdf/built-for-motion.pdf";

export function PdfViewerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden border border-rule bg-background sm:rounded-lg [&>button]:hidden"
      >
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <div>
            <div className="font-serif text-base tracking-tight text-foreground">
              Built for Motion
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
              The Derivn Handbook
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={PDF_URL}
              download
              className="inline-flex items-center gap-2 rounded-full border border-rule px-3 py-1.5 text-xs text-ink-soft transition-colors hover:bg-accent hover:text-foreground"
              title="Download PDF"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
            <button
              onClick={() => onOpenChange(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <iframe
          src={`${PDF_URL}#view=FitH&toolbar=0`}
          title="Built for Motion PDF"
          className="h-full w-full flex-1 bg-paper"
        />
      </DialogContent>
    </Dialog>
  );
}
