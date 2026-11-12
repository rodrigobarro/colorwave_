"use client";

import { useState, type ReactNode } from "react";
import { BackLink } from "@/components/back-link";
import { ColorControls } from "@/components/color-controls";
import { PalettePreviews } from "@/components/palette-previews";
import {
  generateColors,
  getGamut,
  harmonies,
  MAX_COLORS,
  MIN_COLORS,
  mixColors,
  readableOn,
  toCss,
  type Harmony,
  type Oklch,
} from "@/lib/color";
import { MAX_NAME_LENGTH, type Draft } from "@/lib/draft";

const harmonyNames = Object.keys(harmonies) as Harmony[];

const actionClassName =
  "rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15 disabled:opacity-40";

function ColorStrip({ colors }: { colors: readonly Oklch[] }) {
  return (
    // The segments are empty, so a browser that doesn't stretch this strip
    // inside the harmony buttons (iOS WebKit) collapses it to 0 without w-full.
    <span aria-hidden className="flex h-8 w-full overflow-hidden rounded-md">
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

export function PaletteEditor({
  draft,
  onChange,
  backHref,
  renderAction,
}: {
  draft: Draft;
  onChange: (draft: Draft) => void;
  backHref: string;
  // Receives a callback that flags the missing name and focuses its input.
  renderAction: (requireName: () => void) => ReactNode;
}) {
  const [selected, setSelected] = useState(0);
  const [previous, setPrevious] = useState<Draft | null>(null);
  const [isNameMissing, setIsNameMissing] = useState(false);
  // Kept in state, not a ref, because renderAction gets requireName during
  // render and a ref read there would break the React Compiler's rules.
  const [nameInput, setNameInput] = useState<HTMLInputElement | null>(null);

  const { colors } = draft;
  const selectedIndex = Math.min(selected, colors.length - 1);

  function requireName() {
    setIsNameMissing(true);
    nameInput?.focus();
  }

  function generate(base: string, harmony: Harmony) {
    if (isEdited(draft)) setPrevious(draft);

    onChange({
      ...draft,
      base,
      harmony,
      colors: generateColors(base, harmony),
    });
  }

  function undo() {
    if (!previous) return;

    const { base, harmony, colors } = previous;

    onChange({ ...draft, base, harmony, colors });
    setPrevious(null);
  }

  function updateColor(color: Oklch) {
    onChange({
      ...draft,
      colors: colors.with(selectedIndex, color),
    });
  }

  function addColor() {
    const neighbor = colors[selectedIndex + 1] ?? colors[selectedIndex - 1];
    const color = mixColors(colors[selectedIndex], neighbor);

    onChange({
      ...draft,
      colors: colors.toSpliced(selectedIndex + 1, 0, color),
    });
    setSelected(selectedIndex + 1);
  }

  function removeColor() {
    onChange({ ...draft, colors: colors.toSpliced(selectedIndex, 1) });
  }

  function moveColor(offset: number) {
    const target = selectedIndex + offset;

    onChange({
      ...draft,
      colors: colors
        .with(selectedIndex, colors[target])
        .with(target, colors[selectedIndex]),
    });
    setSelected(target);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-8 px-6 pb-16 lg:grid-cols-[18rem_1fr]">
      <div className="flex flex-wrap items-center justify-between gap-4 lg:col-span-2">
        <BackLink href={backHref}>Voltar</BackLink>
        {renderAction(requireName)}
      </div>

      <aside className="flex flex-col gap-6">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Nome
          <input
            ref={setNameInput}
            type="text"
            className="rounded-lg bg-transparent px-3 py-2 font-normal ring-1 ring-foreground/15"
            placeholder="Nome da paleta"
            maxLength={MAX_NAME_LENGTH}
            aria-invalid={isNameMissing}
            aria-describedby={isNameMissing ? "name-error" : undefined}
            value={draft.name}
            onChange={(event) => {
              setIsNameMissing(false);
              onChange({ ...draft, name: event.target.value });
            }}
          />
          {isNameMissing && (
            <span id="name-error" role="alert" className="font-normal">
              Dê um nome à paleta.
            </span>
          )}
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

        <PalettePreviews
          colors={colors}
          paletteName={draft.name.trim() || "nova paleta"}
          title="Prévias"
        />
      </div>
    </main>
  );
}
