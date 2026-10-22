/** Схема каталога материалов (content/library.yaml). */
import { z } from 'zod';

export const LibraryKind = z.enum([
  'textbook',
  'grammar',
  'dictionary',
  'video',
  'audio',
  'course',
  'app',
  'community',
  'media',
  'literature',
  'history',
  'data',
  'tool',
]);
export type LibraryKind = z.infer<typeof LibraryKind>;

export const LibraryItem = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  author: z.string().optional(),
  year: z.union([z.string(), z.number()]).transform(String).optional(),
  kind: LibraryKind,
  level: z.string(),
  lang: z.string(),
  rights: z.enum(['open', 'free', 'print']),
  license: z.string().optional(),
  url: z.string().url().optional(),
  urls: z.array(z.string().url()).default([]),
  note: z.string().optional(),
  top: z.boolean().default(false),
  /** Книга есть у группы (прислана), но файл не публикуется. */
  group: z.boolean().default(false),
  checked: z.string().optional(),
  unreachable: z.boolean().default(false),
});
export type LibraryItem = z.infer<typeof LibraryItem>;

export const LibraryFile = z.object({ items: z.array(LibraryItem).min(1) });
