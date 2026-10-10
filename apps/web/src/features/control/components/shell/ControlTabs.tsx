import { Gamepad2, Images, Inbox, type LucideIcon, PieChart } from "lucide-react";
import type { KeyboardEvent } from "react";

import { controlCopy } from "@/features/control/constants/copy";
import { CONTROL_TABS, type ControlTab } from "@/features/control/constants/tabs";
import { cn } from "@/lib/cn";

const ICONS: Record<ControlTab, LucideIcon> = {
  queue: Inbox,
  photos: Images,
  remote: Gamepad2,
  overview: PieChart,
};

export const tabId = (tab: ControlTab) => `control-tab-${tab}`;
export const panelId = (tab: ControlTab) => `control-panel-${tab}`;

export type ControlTabsProps = {
  current: ControlTab;
  onChange: (tab: ControlTab) => void;
  /** Photos waiting, shown on the Queue tab. */
  waiting: number;
};

/** Segmented control with tab semantics: arrow keys, Home and End move between tabs. */
export function ControlTabs({ current, onChange, waiting }: ControlTabsProps) {
  const onKeyDown = (event: KeyboardEvent) => {
    const index = CONTROL_TABS.indexOf(current);
    const last = CONTROL_TABS.length - 1;
    const target = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = CONTROL_TABS[target] ?? current;
    onChange(next);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={controlCopy.title}
      onKeyDown={onKeyDown}
      className="sticky top-[max(0.5rem,env(safe-area-inset-top))] z-20 -mx-1 mb-5 grid grid-cols-4 gap-1 rounded-control border border-line bg-canvas/80 p-1 backdrop-blur-md"
    >
      {CONTROL_TABS.map((tab) => {
        const Icon = ICONS[tab];
        const selected = tab === current;
        return (
          <button
            key={tab}
            id={tabId(tab)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId(tab)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab)}
            className={cn(
              "relative flex h-14 flex-col items-center justify-center gap-1 rounded-control text-xs font-semibold transition active:scale-95",
              selected ? "bg-ink text-ink-inverse" : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon aria-hidden className="size-5" strokeWidth={1.8} />
            {controlCopy.tabs[tab]}
            {tab === "queue" && waiting > 0 && (
              <span className="absolute top-1 right-2 min-w-5 rounded-pill bg-primary px-1.5 text-xs leading-5 text-on-primary tabular-nums">
                {waiting}
                <span className="sr-only"> waiting</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
