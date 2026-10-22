/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module 'virtual:course' {
  import type { Course } from '$lib/content/schema';
  const course: Course;
  export default course;
}
