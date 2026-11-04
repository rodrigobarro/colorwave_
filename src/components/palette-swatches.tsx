"use client";

import { useState } from "react";
import { readableOn, toCss, toHex, type Oklch } from "@/lib/color";

type Copied = { index: number; hex: string; id: number };

export function PaletteSwatches({ colors }: { colors: readonly Oklch[] }) {
  const [copied, setCopied] = useState<Copied | null>(null);

  async function copy(index: number) {
    const hex = toHex(colors[index]);

    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      // The Clipboard API only exists on HTTPS or localhost, and the browser
      // may deny the write.
      return;
    }

    setCopied((current) => ({ index, hex, id: (current?.id ?? 0) + 1 }));
  }

  function clear(id: number) {
    setCopied((current) => (current?.id === id ? null : current));
  }

  return (
    <div className="flex h-32 overflow-hidden rounded-xl ring-1 ring-foreground/10">
      {colors.map((color, index) => {
        const isCopied = copied?.index === index;
        const label = `Copy ${toHex(color)}`;

        return (
          <button
            key={index}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => copy(index)}
            className="relative basis-0 overflow-hidden transition-[flex-grow] duration-300 ease-out focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-current motion-reduce:transition-none"
            style={{
              backgroundColor: toCss(color),
              color: readableOn(color),
              flexGrow: isCopied ? 3 : 1,
            }}
          >
            {isCopied && (
              <span
                key={copied.id}
                className="absolute inset-x-0 bottom-2 flex flex-col items-center gap-0.5 whitespace-nowrap"
              >
                <span className="animate-copied text-[10px] font-semibold tracking-widest uppercase text-current/70 motion-reduce:animate-copied-fade">
                  Copied
                </span>
                {/* Enters right after "Copied" so it reads first, and ends last. */}
                <span
                  onAnimationEnd={() => clear(copied.id)}
                  className="animate-copied font-mono text-xs font-medium [animation-delay:60ms] motion-reduce:animate-copied-fade"
                >
                  {copied.hex}
                </span>
              </span>
            )}
          </button>
        );
      })}
      <span aria-live="polite" className="sr-only">
        {copied && `${copied.hex} copied`}
      </span>
    </div>
  );
}
