/**
 * Загрузка и проверка контента из папки /content.
 * Используется Vite-плагином (сборка и dev-сервер) и тестами.
 *
 * Структура:
 *   content/course.yaml            — id, title, units: [порядок юнитов]
 *   content/sources.yaml           — список источников
 *   content/lexicon/*.yaml         — словник (items: [...])
 *   content/units/<unit>/unit.yaml — юнит: title, description, guide, lessons: [порядок уроков]
 *   content/units/<unit>/<lesson>.yaml — урок
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { Course, LexiconFile, Lesson, ReaderFile, SourcesFile, Unit, type Exercise } from '../src/lib/content/schema.ts';
import { LibraryFile, type LibraryItem } from '../src/lib/content/library-schema.ts';
import { exerciseRefs } from '../src/lib/content/refs.ts';
export { exerciseRefs };

export class ContentError extends Error {}

/** Порог качества синтеза (доля ошибок обратного распознавания). */
export const AUDIO_MAX_CER = 0.35;

function readYaml(file: string): unknown {
  const text = fs.readFileSync(file, 'utf8');
  try {
    return parse(text, { prettyErrors: true });
  } catch (e) {
    throw new ContentError(`${rel(file)}: ошибка YAML\n${(e as Error).message}`);
  }
}

let ROOT = process.cwd();
const rel = (f: string) => path.relative(ROOT, f);

function check<T extends z.ZodType>(schema: T, data: unknown, file: string): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const msgs = r.error.issues.map((i) => `  • ${i.path.join('.') || '(корень)'}: ${i.message}`).join('\n');
    throw new ContentError(`${rel(file)}: ошибка в данных\n${msgs}`);
  }
  return r.data;
}

const CourseHead = z.object({ id: z.string(), title: z.string(), units: z.array(z.string()).min(1) });
const UnitHead = Unit.omit({ lessons: true }).extend({ lessons: z.array(z.string()).min(1) });

export function loadCourse(contentDir: string, opts: { skipAudioCheck?: boolean } = {}): Course {
  ROOT = path.dirname(contentDir);
  const head = check(CourseHead, readYaml(path.join(contentDir, 'course.yaml')), path.join(contentDir, 'course.yaml'));
  const sources = check(SourcesFile, readYaml(path.join(contentDir, 'sources.yaml')), path.join(contentDir, 'sources.yaml')).sources;

  const lexDir = path.join(contentDir, 'lexicon');
  const lexicon = fs
    .readdirSync(lexDir)
    .filter((f) => f.endsWith('.yaml'))
    .sort()
    .flatMap((f) => check(LexiconFile, readYaml(path.join(lexDir, f)), path.join(lexDir, f)).items);

  // Озвучка: если в public/audio/manifest.json есть синтез этой фразы, прошедший обратную проверку
  // распознаванием (CER ≤ 0,35, см. docs/audio-qa.md), подключаем его с пометкой «синтез».
  const manPath = path.join(ROOT, 'public', 'audio', 'manifest.json');
  if (fs.existsSync(manPath)) {
    const man = JSON.parse(fs.readFileSync(manPath, 'utf8')) as { items: Record<string, { text: string; cer?: number }> };
    for (const it of lexicon) {
      const a = man.items[it.id];
      if (!it.audio && a && a.text === it.udm && (a.cer ?? 1) <= AUDIO_MAX_CER) {
        it.audio = it.id;
        it.audio_synth = true;
      }
    }
  }

  const errors: string[] = [];
  const lexIds = new Map<string, (typeof lexicon)[number]>();
  for (const it of lexicon) {
    if (lexIds.has(it.id)) errors.push(`словник: повторяется id «${it.id}»`);
    lexIds.set(it.id, it);
  }
  const srcIds = new Set(sources.map((s) => s.id));
  for (const it of lexicon)
    for (const s of it.sources) if (!srcIds.has(s.id)) errors.push(`словник «${it.id}»: неизвестный источник «${s.id}» (добавьте его в sources.yaml)`);

  const units = head.units.map((uid) => {
    const udir = path.join(contentDir, 'units', uid);
    const ufile = path.join(udir, 'unit.yaml');
    const uh = check(UnitHead, readYaml(ufile), ufile);
    if (uh.id !== uid) errors.push(`${rel(ufile)}: id «${uh.id}» не совпадает с папкой «${uid}»`);
    const lessons = uh.lessons.map((lid) => {
      const lfile = path.join(udir, `${lid}.yaml`);
      if (!fs.existsSync(lfile)) throw new ContentError(`${rel(ufile)}: урок «${lid}» указан, но файла ${rel(lfile)} нет`);
      const lesson = check(Lesson, readYaml(lfile), lfile);
      if (lesson.id !== lid) errors.push(`${rel(lfile)}: id «${lesson.id}» не совпадает с именем файла`);
      lesson.exercises.forEach((ex, i) => {
        for (const ref of exerciseRefs(ex)) {
          const it = lexIds.get(ref);
          if (!it) errors.push(`${rel(lfile)}: упражнение №${i + 1} (${ex.type}) ссылается на неизвестное слово «${ref}»`);
          else if (it.status === 'draft') errors.push(`${rel(lfile)}: упражнение №${i + 1} использует черновик «${ref}» (status: draft) — сначала проверьте слово`);
        }
        if (ex.type === 'fill' && !ex.options.includes(ex.answer)) errors.push(`${rel(lfile)}: упражнение №${i + 1} (fill): ответа «${ex.answer}» нет среди вариантов`);
        if (ex.type === 'dialogue' && !ex.options.includes(ex.answer)) errors.push(`${rel(lfile)}: упражнение №${i + 1} (dialogue): ответа нет среди вариантов`);
        if (ex.type === 'build') {
          const it = lexIds.get(ex.item);
          if (it && it.morphemes.length < 2) errors.push(`${rel(lfile)}: упражнение №${i + 1} (build): у слова «${ex.item}» меньше двух морфем`);
        }
        if (ex.type === 'listen' && !opts.skipAudioCheck) {
          const it = lexIds.get(ex.item);
          if (it && !it.audio) errors.push(`${rel(lfile)}: упражнение №${i + 1} (listen): у слова «${ex.item}» нет аудио`);
        }
      });
      return lesson;
    });
    return { ...uh, lessons };
  });

  const ids = new Set<string>();
  for (const u of units)
    for (const l of u.lessons) {
      if (ids.has(l.id)) errors.push(`урок «${l.id}» встречается дважды`);
      ids.add(l.id);
    }

  // Читалка: content/reader.yaml — тексты из фраз словника.
  const readerFile = path.join(contentDir, 'reader.yaml');
  const texts = fs.existsSync(readerFile) ? check(ReaderFile, readYaml(readerFile), readerFile).texts : [];
  const unitIds = new Set(units.map((u) => u.id));
  const textIds = new Set<string>();
  for (const t of texts) {
    if (textIds.has(t.id)) errors.push(`${rel(readerFile)}: текст «${t.id}» встречается дважды`);
    textIds.add(t.id);
    if (!unitIds.has(t.after)) errors.push(`${rel(readerFile)}: текст «${t.id}»: нет юнита «${t.after}»`);
    for (const l of t.lines) {
      const it = lexIds.get(l.item);
      if (!it) errors.push(`${rel(readerFile)}: текст «${t.id}»: нет слова «${l.item}» в словнике`);
      else if (it.status === 'draft') errors.push(`${rel(readerFile)}: текст «${t.id}»: «${l.item}» — черновик, в текст нельзя`);
    }
    for (const q of t.questions)
      if (!q.options.includes(q.answer)) errors.push(`${rel(readerFile)}: текст «${t.id}»: ответ «${q.answer}» не среди вариантов`);
  }

  if (errors.length) throw new ContentError(`Ошибки в контенте:\n${errors.map((e) => '  • ' + e).join('\n')}`);
  return Course.parse({ id: head.id, title: head.title, units, lexicon, sources, texts });
}

/** Каталог материалов: content/library.yaml. */
export function loadLibrary(contentDir: string): LibraryItem[] {
  ROOT = path.dirname(contentDir);
  const file = path.join(contentDir, 'library.yaml');
  const items = check(LibraryFile, readYaml(file), file).items;
  const seen = new Set<string>();
  for (const it of items) {
    if (seen.has(it.id)) throw new ContentError(`${rel(file)}: повторяется id «${it.id}»`);
    seen.add(it.id);
  }
  return items;
}
