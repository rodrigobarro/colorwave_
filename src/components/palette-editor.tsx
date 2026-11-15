"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { BackLink } from "@/components/back-link";
import { ColorControls } from "@/components/color-controls";
import { ColorStrip } from "@/components/color-strip";
import { ImageSource } from "@/components/image-source";
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
import { MAX_NAME_LENGTH, type Draft, type PaletteSource } from "@/lib/draft";
import type { SourceImage } from "@/lib/source-image";

const harmonyNames = Object.keys(harmonies) as Harmony[];

const actionClassName =
  "rounded-lg px-3 py-1.5 text-sm ring-1 ring-foreground/15 disabled:opacity-40";

const sourceTabClassName =
  "flex-1 rounded-md px-3 py-1.5 text-sm aria-selected:bg-foreground aria-selected:text-background";

const sourceTabs: { source: PaletteSource; label: string }[] = [
  { source: "harmony", label: "Color + harmony" },
  { source: "image", label: "Image" },
];

type Origin = Pick<Draft, "source" | "base" | "harmony" | "imageStyle">;

// The colors the draft's source generates, before any manual adjustment. Null
// while a palette made from an image doesn't have its image loaded.
function sourceColors(
  { source, base, harmony, imageStyle }: Origin,
  image: SourceImage | null,
) {
  if (source === "image") return image?.palettes[imageStyle] ?? null;

  return generateColors(base, harmony);
}

function isEdited(draft: Draft, image: SourceImage | null) {
  const generated = sourceColors(draft, image);

  return (
    !generated || JSON.stringify(draft.colors) !== JSON.stringify(generated)
  );
}

function HarmonySource({
  draft,
  onGenerate,
}: {
  draft: Draft;
  onGenerate: (changes: Partial<Origin>) => void;
}) {
  // A palette made from an image keeps the last harmony settings, but none of
  // them is what its colors come from.
  const isActive = draft.source === "harmony";

  return (
    <>
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
              onGenerate({ source: "harmony", base: event.target.value })
            }
          />
        </span>
      </label>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Harmonia</h3>
        <div className="grid grid-cols-2 gap-2">
          {harmonyNames.map((harmony) => (
            <button
              key={harmony}
              type="button"
              aria-pressed={isActive && harmony === draft.harmony}
              className="flex flex-col gap-2 rounded-lg p-2 text-left text-xs ring-1 ring-foreground/15 aria-pressed:ring-2 aria-pressed:ring-foreground"
              onClick={() => onGenerate({ source: "harmony", harmony })}
            >
              <ColorStrip colors={generateColors(draft.base, harmony)} />
              {harmonies[harmony].label}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

export function PaletteEditor({
  draft,
  onChange,
  image,
  onImageChange,
  backHref,
  renderAction,
}: {
  draft: Draft;
  onChange: (draft: Draft) => void;
  // The image the palette is made from, if one was picked. Kept by the page,
  // which decides whether it survives a reload.
  image: SourceImage | null;
  onImageChange: (image: SourceImage | null) => void;
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
  // Null until the user picks a tab, so it follows the draft's source, which a
  // restored draft only has after hydration.
  const [chosenTab, setChosenTab] = useState<PaletteSource | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const tab = chosenTab ?? draft.source;

  const { colors } = draft;
  const selectedIndex = Math.min(selected, colors.length - 1);

  function requireName() {
    setIsNameMissing(true);
    nameInput?.focus();
  }

  // Replaces the colors with what the new origin generates, keeping the manual
  // adjustments it overwrites for undo.
  function generate(changes: Partial<Origin>, nextImage = image) {
    const next = { ...draft, ...changes };
    const colors = sourceColors(next, nextImage);

    if (!colors) return;
    if (isEdited(draft, image)) setPrevious(draft);

    onChange({ ...next, colors });
  }

  function undo() {
    if (!previous) return;

    const { source, base, harmony, imageStyle, colors } = previous;

    onChange({ ...draft, source, base, harmony, imageStyle, colors });
    setPrevious(null);
  }

  function pickImage(next: SourceImage) {
    onImageChange(next);
    generate({ source: "image" }, next);
  }

  function selectTab(index: number) {
    const next = (index + sourceTabs.length) % sourceTabs.length;

    setChosenTab(sourceTabs[next].source);
    tabs.current[next]?.focus();
  }

  // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern.
  function onTabKeyDown(event: KeyboardEvent) {
    const current = sourceTabs.findIndex(({ source }) => source === tab);
    const moves: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: sourceTabs.length - 1,
    };

    if (!(event.key in moves)) return;

    event.preventDefault();
    selectTab(moves[event.key]);
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

        <section className="flex flex-col gap-4">
          <h2 id={`${id}-source`} className="sr-only">
            Start from
          </h2>
          <div
            role="tablist"
            aria-labelledby={`${id}-source`}
            className="flex gap-1 rounded-lg p-1 ring-1 ring-foreground/15"
            onKeyDown={onTabKeyDown}
          >
            {sourceTabs.map(({ source, label }, index) => (
              <button
                key={source}
                ref={(element) => {
                  tabs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${source}`}
                aria-selected={source === tab}
                aria-controls={`${id}-panel`}
                tabIndex={source === tab ? 0 : -1}
                className={sourceTabClassName}
                onClick={() => setChosenTab(source)}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`${id}-panel`}
            aria-labelledby={`${id}-tab-${tab}`}
            className="flex flex-col gap-6"
          >
            {tab === "harmony" ? (
              <HarmonySource draft={draft} onGenerate={generate} />
            ) : (
              <ImageSource
                image={image}
                style={draft.imageStyle}
                isActive={draft.source === "image"}
                onImage={pickImage}
                onStyle={(imageStyle) =>
                  generate({ source: "image", imageStyle })
                }
                onRemove={() => onImageChange(null)}
              />
            )}
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
