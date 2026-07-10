const STYLES: Record<string, string> = {
  active: "bg-good/15 text-good border-good/30",
  inactive: "bg-muted/15 text-muted border-muted/30",
  vacant: "bg-blue-glow/15 text-blue-glow border-blue-glow/30",
  occupied: "bg-violet/15 text-violet-soft border-violet/30",
  reserved: "bg-warn/15 text-warn border-warn/30",
  completed: "bg-muted/15 text-muted border-muted/30",
  on_hold: "bg-warn/15 text-warn border-warn/30",
};

export function Badge({ status }: { status: string }) {
  const style = STYLES[status] || "bg-muted/15 text-muted border-muted/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {status.replace("_", " ")}
    </span>
  );
}
