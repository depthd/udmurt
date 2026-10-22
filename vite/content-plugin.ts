/**
 * Vite-плагин: превращает YAML из /content в виртуальный модуль `virtual:course`.
 * Ошибки в контенте останавливают сборку с понятным сообщением.
 */
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
      this.addWatchFile(contentDir);
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
