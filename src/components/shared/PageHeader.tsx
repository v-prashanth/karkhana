"use client";
import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  backHref?: string;
  onBack?: () => void;
  action?: ReactNode;
  onAdd?: () => void;
  addHref?: string;
}

export function PageHeader({ title, subtitle, backHref, onBack, action, onAdd, addHref }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-border/50 bg-background/80 px-5 py-3.5 backdrop-blur-3xl xl:px-8 xl:py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {(backHref || onBack) && (
            <button
              onClick={handleBack}
              className="h-9 w-9 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors -ml-1"
            >
              <ArrowLeft className="h-4.5 w-4.5 text-muted-foreground" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground xl:text-2xl">{title}</h1>
            {subtitle && (
              <p className="text-xs font-semibold text-accent/80 uppercase tracking-widest mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {(onAdd || addHref) && (
            <button
              onClick={() => {
                if (onAdd) onAdd();
                else if (addHref) router.push(addHref);
              }}
              className="h-9 w-9 rounded-full bg-accent text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,107,43,0.3)] hover:shadow-[0_0_30px_rgba(255,107,43,0.5)] transition-shadow"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
