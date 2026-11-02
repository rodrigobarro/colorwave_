import Link from "next/link";
import { toCss } from "@/lib/color";
import { getPageCount, getPalettePage } from "@/lib/palettes";

function pageHref(page: number) {
  return page === 1 ? "/" : `/page/${page}`;
}

function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-center gap-4 text-sm"
    >
      {page > 1 && <Link href={pageHref(page - 1)}>Anterior</Link>}
      {pages.map((number) => (
        <Link
          key={number}
          href={pageHref(number)}
          aria-current={number === page ? "page" : undefined}
          className="text-foreground/60 aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
        >
          {number}
        </Link>
      ))}
      {page < pageCount && <Link href={pageHref(page + 1)}>Próxima</Link>}
    </nav>
  );
}

export async function PaletteGallery({ page }: { page: number }) {
  const [palettes, pageCount] = await Promise.all([
    getPalettePage(page),
    getPageCount(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 pb-16">
      <Link href="/create" className="self-center text-sm font-medium">
        Criar paleta
      </Link>
      <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {palettes.map((palette) => (
          <li key={palette.id}>
            <div
              aria-hidden
              className="flex h-32 overflow-hidden rounded-xl ring-1 ring-foreground/10"
            >
              {palette.colors.map((color) => (
                <div
                  key={toCss(color)}
                  className="flex-1"
                  style={{ backgroundColor: toCss(color) }}
                />
              ))}
            </div>
            <p className="mt-3 text-sm font-medium">{palette.name}</p>
          </li>
        ))}
      </ul>
      <Pagination page={page} pageCount={pageCount} />
    </main>
  );
}
