import { regionFor } from "@/lib/regions";
import { cn } from "@/lib/utils";

type CurrencyChipProps = {
  currency: string | null | undefined;
  showFlag?: boolean;
  className?: string;
};

/** Small colored pill like "🇸🇬 SGD". The color is stable per currency across the app. */
export function CurrencyChip({ currency, showFlag = true, className }: CurrencyChipProps) {
  const region = regionFor(currency);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-none ring-1 ring-inset tabular-nums",
        region.chip,
        className
      )}
      title={region.label}
    >
      {showFlag && <span aria-hidden>{region.flag}</span>}
      {region.currency}
    </span>
  );
}

/** Section heading for a region: flag, name, currency chip, and optional totals on the right. */
export function RegionHeading({
  currency,
  count,
  children,
  className,
}: {
  currency: string;
  count?: number;
  children?: React.ReactNode;
  className?: string;
}) {
  const region = regionFor(currency);
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("h-4 w-1 shrink-0 rounded-full", region.swatch)} aria-hidden />
        <span className="text-base leading-none" aria-hidden>
          {region.flag}
        </span>
        <span className="truncate text-sm font-semibold">{region.label}</span>
        <CurrencyChip currency={currency} showFlag={false} />
        {count !== undefined && (
          <span className="text-xs text-muted-foreground">
            {count} account{count === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {children && <div className="shrink-0 text-right">{children}</div>}
    </div>
  );
}
