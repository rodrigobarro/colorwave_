import {
  getGamut,
  toCss,
  toSrgbGamut,
  type Gamut,
  type Oklch,
} from "@/lib/color";

const MAX_CHROMA = 0.4;
const HUE_STOPS = Array.from({ length: 13 }, (_, index) => index * 30);

const gamutMessages: Record<Exclude<Gamut, "srgb">, string> = {
  p3: "Esta cor só aparece em telas P3. Nas demais, o navegador usa a mais próxima.",
  outside:
    "Esta cor não existe em sRGB nem em P3. O navegador sempre vai aproximá-la.",
};

function getChannels([lightness, chroma, hue]: Oklch) {
  return [
    {
      label: "Luminosidade",
      max: 1,
      step: 0.005,
      track: `linear-gradient(to right in oklch, oklch(0 ${chroma} ${hue}), oklch(1 ${chroma} ${hue}))`,
    },
    {
      label: "Croma",
      max: MAX_CHROMA,
      step: 0.001,
      track: `linear-gradient(to right in oklch, oklch(${lightness} 0 ${hue}), oklch(${lightness} ${MAX_CHROMA} ${hue}))`,
    },
    {
      label: "Matiz",
      max: 360,
      step: 1,
      track: `linear-gradient(to right, ${HUE_STOPS.map(
        (stop) => `oklch(${lightness} ${chroma} ${stop})`,
      ).join(", ")})`,
    },
  ];
}

export function ColorControls({
  color,
  onChange,
}: {
  color: Oklch;
  onChange: (color: Oklch) => void;
}) {
  const gamut = getGamut(color);

  return (
    <div className="flex flex-col gap-4">
      {getChannels(color).map(({ label, max, step, track }, channel) => (
        <label key={label} className="flex flex-col gap-2 text-sm">
          <span className="flex justify-between">
            {label}
            <span className="font-mono text-foreground/60">
              {color[channel]}
            </span>
          </span>
          <input
            type="range"
            className="color-slider"
            style={{ backgroundImage: track }}
            min={0}
            max={max}
            step={step}
            value={color[channel]}
            onChange={(event) =>
              onChange(
                color.map((value, index) =>
                  index === channel ? Number(event.target.value) : value,
                ) as unknown as Oklch,
              )
            }
          />
        </label>
      ))}
      <p className="font-mono text-xs text-foreground/60">{toCss(color)}</p>
      {gamut !== "srgb" && (
        <div className="flex flex-col items-start gap-2 text-sm">
          <p>{gamutMessages[gamut]}</p>
          <button
            type="button"
            className="font-medium underline"
            onClick={() => onChange(toSrgbGamut(color))}
          >
            Trazer para sRGB
          </button>
        </div>
      )}
    </div>
  );
}
