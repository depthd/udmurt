/**
 * Vite-плагин: превращает YAML из /content в виртуальный модуль `virtual:course`.
 * Ошибки в контенте останавливают сборку с понятным сообщением.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { loadCourse } from './load-content.ts';

const ID = 'virtual:course';
const RESOLVED = '\0' + ID;

export function contentPlugin(contentDir = path.resolve('content')): Plugin {
  return {
    name: 'udmurt-content',
    resolveId(id) {
      if (id === ID) return RESOLVED;
    },
    load(id) {
      if (id !== RESOLVED) return;
      const course = loadCourse(contentDir);
      // Следим за каждым YAML-файлом (каталог целиком Vite 8 пытается импортировать как модуль).
      for (const f of fs.readdirSync(contentDir, { recursive: true }) as string[])
        if (f.endsWith('.yaml')) this.addWatchFile(path.join(contentDir, f));
      return `export default ${JSON.stringify(course)};`;
    },
    configureServer(server) {
      server.watcher.add(contentDir);
      server.watcher.on('all', (_e, file) => {
        if (!file.startsWith(contentDir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}
