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
        className="flex h-[90vh] w-[95vw] max-w-4xl flex-col gap-0 overflow-hidden border border-rule bg-background p-0 sm:rounded-lg [&>button]:hidden"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-rule px-5 py-3">
          <div className="font-serif text-base tracking-tight text-foreground">
            Built for Motion
          </div>
          <div className="flex items-center gap-1">
            <a
              href={PDF_URL}
              download
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-ink-soft transition-colors hover:bg-accent hover:text-foreground"
              title="Download PDF"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <object
          data={`${PDF_URL}#view=FitH&toolbar=0&navpanes=0`}
          type="application/pdf"
          className="min-h-0 flex-1 bg-paper"
          aria-label="Built for Motion PDF"
        >
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-ink-soft">
              Your browser can&rsquo;t preview the PDF inline.
            </p>
            <a href={PDF_URL} download className="btn-primary">
              Download PDF
            </a>
          </div>
        </object>
      </DialogContent>
    </Dialog>
  );
}
