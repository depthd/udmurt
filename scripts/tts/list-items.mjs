#!/usr/bin/env node
// Список фраз для озвучки: node --experimental-strip-types scripts/tts/list-items.mjs > items.json
// Фразы с {name} пропускаем — имя ученика заранее не известно.
const { loadCourse } = await import('../../vite/load-content.ts');
const course = loadCourse(process.cwd() + '/content');
const items = course.lexicon
  .filter((i) => i.status !== 'draft' && !i.udm.includes('{name}') && !i.audio)
  .map((i) => ({ id: i.id, text: i.udm }));
process.stdout.write(JSON.stringify(items, null, 1));
