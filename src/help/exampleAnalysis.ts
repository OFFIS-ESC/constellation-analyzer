import exampleDocument from './exampleAnalysis.json';
import type { ConstellationDocument } from '../stores/persistence/types';

/**
 * The worked example analysis — Tier 0 of the help model
 *
 * A populated graph teaches the vocabulary faster than any amount of prose, so
 * the empty state offers one.
 *
 * `exampleAnalysis.json` is a plain document file, byte-identical in shape to
 * whatever File > Export Document produces. To replace the example, build the
 * analysis you want in the app, export it, and overwrite that file — no code
 * changes needed. Nothing here inspects its contents.
 *
 * State ids inside the file can stay fixed: they only have to be unique within
 * their own document, since timelines are keyed per document.
 */

export function buildExampleDocument(): ConstellationDocument {
  // A fresh copy each call, so opening the example twice cannot produce two
  // documents sharing the same mutable graph objects.
  return structuredClone(exampleDocument) as unknown as ConstellationDocument;
}

export const EXAMPLE_TITLE: string =
  (exampleDocument as { metadata?: { title?: string } }).metadata?.title ?? 'Example Analysis';
