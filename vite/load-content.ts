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
import { Course, LexiconFile, Lesson, SourcesFile, Unit, type Exercise } from '../src/lib/content/schema.ts';

export class ContentError extends Error {}

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

/** Все id словника, на которые ссылается упражнение. */
export function exerciseRefs(ex: Exercise): string[] {
  switch (ex.type) {
    case 'teach':
    case 'tiles':
    case 'type':
    case 'build':
      return [ex.item];
    case 'choice':
      return [ex.item, ...ex.distractors];
    case 'listen':
      return [ex.item, ...ex.distractors];
    case 'match':
      return ex.items;
    case 'fill':
      return ex.item ? [ex.item] : [];
    case 'dialogue':
      return ex.lines.flatMap((l) => (l.item ? [l.item] : []));
  }
}

export function loadCourse(contentDir: string): Course {
  ROOT = path.dirname(contentDir);
  const head = check(CourseHead, readYaml(path.join(contentDir, 'course.yaml')), path.join(contentDir, 'course.yaml'));
  const sources = check(SourcesFile, readYaml(path.join(contentDir, 'sources.yaml')), path.join(contentDir, 'sources.yaml')).sources;

  const lexDir = path.join(contentDir, 'lexicon');
  const lexicon = fs
    .readdirSync(lexDir)
    .filter((f) => f.endsWith('.yaml'))
    .sort()
    .flatMap((f) => check(LexiconFile, readYaml(path.join(lexDir, f)), path.join(lexDir, f)).items);

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
        if (ex.type === 'listen') {
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

  if (errors.length) throw new ContentError(`Ошибки в контенте:\n${errors.map((e) => '  • ' + e).join('\n')}`);
  return Course.parse({ id: head.id, title: head.title, units, lexicon, sources });
}
