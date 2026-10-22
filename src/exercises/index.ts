/** Реестр компонентов упражнений: тип → компонент. */
import type { Component } from 'svelte';
import type { ExerciseType } from '$lib/content/schema';
import type { ExerciseProps } from './types';
import Teach from './Teach.svelte';
import Choice from './Choice.svelte';
import Tiles from './Tiles.svelte';
import Match from './Match.svelte';
import Type from './Type.svelte';
import Fill from './Fill.svelte';
import Build from './Build.svelte';
import Listen from './Listen.svelte';
import Dialogue from './Dialogue.svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const exerciseComponents: Record<ExerciseType, Component<ExerciseProps<any>>> = {
  teach: Teach,
  choice: Choice,
  tiles: Tiles,
  match: Match,
  type: Type,
  fill: Fill,
  build: Build,
  listen: Listen,
  dialogue: Dialogue,
};

/** Подсказка-заголовок над упражнением. */
export const exerciseTitles: Record<ExerciseType, string> = {
  teach: 'Новое слово',
  choice: 'Выберите перевод',
  tiles: 'Соберите перевод',
  match: 'Найдите пары',
  type: 'Напишите перевод',
  fill: 'Вставьте пропуск',
  build: 'Соберите слово',
  listen: 'Послушайте',
  dialogue: 'Прочитайте диалог',
};
