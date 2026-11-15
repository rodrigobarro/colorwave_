// The new-palette draft's source image. It lives in IndexedDB, not next to the
// draft in localStorage, which only holds a few megabytes of text. It has to
// outlast a reload and the sign-in redirect, which leaves the page.

const DATABASE = "colorwave";
const STORE = "draft-image";
const KEY = "current";

function open() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);

    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest,
) {
  const database = await open();

  try {
    return await new Promise<unknown>((resolve, reject) => {
      const request = action(database.transaction(STORE, mode).objectStore(STORE));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

// Storage can be blocked, as in some private windows; the image is then kept
// only in memory and a reload loses it, while the colors stay in the draft.
export async function readDraftImage() {
  try {
    const value = await run("readonly", (store) => store.get(KEY));

    return value instanceof Blob ? value : null;
  } catch {
    return null;
  }
}

export async function writeDraftImage(blob: Blob | null) {
  try {
    await run("readwrite", (store) =>
      blob ? store.put(blob, KEY) : store.delete(KEY),
    );
  } catch {
    // Same as above: nothing to do but keep the image in memory.
  }
}
