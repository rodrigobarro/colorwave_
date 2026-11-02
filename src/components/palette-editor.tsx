"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ColorControls } from "@/components/color-controls";
import { GradientPreview } from "@/components/gradient-preview";
import {
  generateColors,
  getGamut,
  harmonies,
  mixColors,
  readableOn,
  toCss,
  type Harmony,
  type Oklch,
} from "@/lib/color";
import {
  getDraft,
  getInitialDraft,
  MAX_COLORS,
  MIN_COLORS,
  saveDraft,
  subscribeToDraft,
  type Draft,
} from "@/lib/draft";

const harmonyNames = Object.keys(harmonies) as Harmony[];

const actionClassName =
  "rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15 disabled:opacity-40";

function ColorStrip({ colors }: { colors: readonly Oklch[] }) {
  return (
    <span aria-hidden className="flex h-8 overflow-hidden rounded-md">
      {colors.map((color, index) => (
        <span
          key={index}
          className="flex-1"
          style={{ backgroundColor: toCss(color) }}
        />
      ))}
    </span>
  );
}

function isEdited({ base, harmony, colors }: Draft) {
  return (
    JSON.stringify(colors) !== JSON.stringify(generateColors(base, harmony))
  );
}

export function PaletteEditor() {
  const draft = useSyncExternalStore(
    subscribeToDraft,
    getDraft,
    getInitialDraft,
  );
  const [selected, setSelected] = useState(0);
  const [previous, setPrevious] = useState<Draft | null>(null);

  const { colors } = draft;
  const selectedIndex = Math.min(selected, colors.length - 1);

  function generate(base: string, harmony: Harmony) {
    if (isEdited(draft)) setPrevious(draft);

    saveDraft({
      ...draft,
      base,
      harmony,
      colors: generateColors(base, harmony),
    });
  }

  function undo() {
    if (!previous) return;

    const { base, harmony, colors } = previous;

    saveDraft({ ...draft, base, harmony, colors });
    setPrevious(null);
  }

  function updateColor(color: Oklch) {
    saveDraft({
      ...draft,
      colors: colors.with(selectedIndex, color),
    });
  }

  function addColor() {
    const neighbor = colors[selectedIndex + 1] ?? colors[selectedIndex - 1];
    const color = mixColors(colors[selectedIndex], neighbor);

    saveDraft({
      ...draft,
      colors: colors.toSpliced(selectedIndex + 1, 0, color),
    });
    setSelected(selectedIndex + 1);
  }

  function removeColor() {
    saveDraft({ ...draft, colors: colors.toSpliced(selectedIndex, 1) });
  }

  function moveColor(offset: number) {
    const target = selectedIndex + offset;

    saveDraft({
      ...draft,
      colors: colors
        .with(selectedIndex, colors[target])
        .with(target, colors[selectedIndex]),
    });
    setSelected(target);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-8 px-6 pb-16 lg:grid-cols-[18rem_1fr]">
      <Link
        href="/"
        className="flex items-center gap-2 justify-self-start rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15 lg:col-span-2"
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 8H3M7 4 3 8l4 4" />
        </svg>
        Voltar
      </Link>

      <aside className="flex flex-col gap-6">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Nome
          <input
            type="text"
            className="rounded-lg bg-transparent px-3 py-2 font-normal ring-1 ring-foreground/15"
            placeholder="Nome da paleta"
            maxLength={60}
            value={draft.name}
            onChange={(event) =>
              saveDraft({ ...draft, name: event.target.value })
            }
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between text-sm font-medium">
          Cor base
          <span className="flex items-center gap-3">
            <span className="font-mono font-normal text-foreground/60">
              {draft.base}
            </span>
            <input
              type="color"
              className="color-swatch size-10 rounded-xl ring-1 ring-foreground/10"
              value={draft.base}
              onChange={(event) =>
                generate(event.target.value, draft.harmony)
              }
            />
          </span>
        </label>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Harmonia</h2>
          <div className="grid grid-cols-2 gap-2">
            {harmonyNames.map((harmony) => (
              <button
                key={harmony}
                type="button"
                aria-pressed={harmony === draft.harmony}
                className="flex flex-col gap-2 rounded-lg p-2 text-left text-xs ring-1 ring-foreground/15 aria-pressed:ring-2 aria-pressed:ring-foreground"
                onClick={() => generate(draft.base, harmony)}
              >
                <ColorStrip colors={generateColors(draft.base, harmony)} />
                {harmonies[harmony].label}
              </button>
            ))}
          </div>
          {previous && (
            <button
              type="button"
              className="self-start text-sm font-medium underline"
              onClick={undo}
            >
              Desfazer e voltar aos ajustes manuais
            </button>
          )}
        </section>
      </aside>

      <div className="flex min-w-0 flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="sr-only">Cores da paleta</h2>
          <div className="flex h-48 overflow-hidden rounded-xl ring-1 ring-foreground/10">
            {colors.map((color, index) => (
              <button
                key={index}
                type="button"
                aria-pressed={index === selectedIndex}
                aria-label={`Cor ${index + 1}: ${toCss(color)}${
                  getGamut(color) === "srgb" ? "" : ", fora de sRGB"
                }`}
                className="flex flex-1 items-end justify-center pb-3 font-mono text-xs transition-[flex-grow] aria-pressed:grow-[1.6] aria-pressed:font-semibold"
                style={{
                  backgroundColor: toCss(color),
                  color: readableOn(color),
                }}
                onClick={() => setSelected(index)}
              >
                {getGamut(color) === "srgb" ? index + 1 : `${index + 1} !`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={actionClassName}
              disabled={selectedIndex === 0}
              onClick={() => moveColor(-1)}
            >
              Mover para a esquerda
            </button>
            <button
              type="button"
              className={actionClassName}
              disabled={selectedIndex === colors.length - 1}
              onClick={() => moveColor(1)}
            >
              Mover para a direita
            </button>
            <button
              type="button"
              className={actionClassName}
              disabled={colors.length >= MAX_COLORS}
              onClick={addColor}
            >
              Adicionar cor
            </button>
            <button
              type="button"
              className={actionClassName}
              disabled={colors.length <= MIN_COLORS}
              onClick={removeColor}
            >
              Remover cor
            </button>
          </div>
          <ColorControls
            color={colors[selectedIndex]}
            onChange={updateColor}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium">Prévia do gradiente</h2>
          <GradientPreview colors={colors} />
        </section>
      </div>
    </main>
  );
}
