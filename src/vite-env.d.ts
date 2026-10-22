/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module 'virtual:course' {
  import type { Course } from '$lib/content/schema';
  const course: Course;
  export default course;
}

declare module 'virtual:library' {
  import type { LibraryItem } from '$lib/content/library-schema';
  const items: LibraryItem[];
  export default items;
}
