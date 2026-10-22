# 04. Дизайн- и моушн-система: «залипательно», чисто, по-удмуртски

> Исследовательский отчёт для сайта изучения удмуртского языка (GitHub Pages, статический сайт, прогресс в браузере).
> Дата проверки всех версий, размеров и шрифтов: **21.10.2026**.
>
> Обозначения: ✅ подтверждено источником или нашей проверкой · 🔹 вторичный источник или реконструкция · ⚠️ не подтверждено.
> Удмуртские слова в отчёте взяты только из словарных источников (ru.wiktionary, ru.wikipedia, научная статья). У каждого слова есть ссылка.

---

## 0. Коротко (TL;DR)

1. **Шрифты — главный риск, и он проверен.** Мы скачали 105 семейств с Google Fonts и проверили их таблицы символов (cmap) через `fontTools`. Все 10 удмуртских букв **Ӝ ӝ Ӟ ӟ Ӥ ӥ Ӧ ӧ Ӵ ӵ** есть в 64 семействах. В 39 их нет совсем, в двух они есть частично. **Manrope, Unbounded, Jost, Wix Madefor, Sofia Sans, Plus Jakarta Sans, Literata, Spectral и JetBrains Mono не подходят.** Коварнее всего **Roboto Flex** (есть 4 из 10) и **Source Sans 3** (2 из 10): в них слово рассыплется на два разных шрифта.
2. **Рекомендуемая пара шрифтов:** **Rubik** для заголовков, чисел и кнопок (в описании Google Fonts — «slightly rounded corners», «слегка скруглённые углы»; есть табличные цифры `tnum`) и **Nunito** для текста («rounded terminal sans», гротеск со скруглёнными окончаниями). Обе гарнитуры вариативные, лицензия OFL, все 10 букв есть во всех начертаниях. Удмуртские буквы лежат в сабсете **`cyrillic-ext`**, а не в `cyrillic`. Лучше всего — свой сабсет: один woff2-файл **~36 КБ на семейство** (рецепт в §6.5).
3. **Моушн-токены:** длительности 100–450 мс. Кривые взяты из Material 3: `cubic-bezier(0.2,0,0,1)` и `cubic-bezier(0.05,0.7,0.1,1)`. Пружины мы сгенерировали сами и записали через CSS `linear()` (Baseline с декабря 2023). Реакция на ответ должна приходить быстрее 100 мс: это порог «мгновенно» по Нильсену.
4. **«Сочность» строится из мелочей, а не из библиотек.** Кнопка с «объёмом», плашка снизу, пружинный «поп», мягкая тряска при ошибке, перелив прогресс-бара, синтезированный звук через WebAudio (без файлов), вибрация (Android) и конфетти. Почти всё делается на чистом CSS и Web Animations API. Внешних зависимостей две: `canvas-confetti` (ISC, ~6 КБ br) и, по желанию, Motion mini (~3,2 КБ).
5. **Визуальная идентичность — северная удмуртская вышивка.** Глазов стоит на севере, на Чепце, а у северных удмуртов одежда белая и украшена вышивкой. Цвета берём из официальной символики Удмуртии: чёрный — «земля и стабильность», белый — «космос и чистота нравственных устоев», красный — «солнце и жизнь». Главный мотив — восьмиконечный знак **толэзе** («лунный узор»). Его точная геометрия описана в Положении о флаге, и мы воспроизвели её одной SVG-строкой.
6. **Ключевая метафора — «путь-нитка».** Линия пути уроков — это нить со стежками. Каждый пройденный урок «вышивает» мотив, каждый юнит — полосу орнамента.
7. **Маскот — лебедёнок «Юсь»** (*юсь* — «лебедь» по-удмуртски, [ru.wiktionary](https://ru.wiktionary.org/wiki/юсь)). Белый лебедь изображён на гербе республики как символ «возрождения, мудрости, мужества». Второй персонаж для аудирования — **«Пельнянь»**: *пель* — «ухо», *нянь* — «хлеб». От этого слова происходит русское «пельмени» ([Фасмер](https://ru.wikipedia.org/wiki/Пельмени)).
8. **Доступность встроена с самого начала.** Есть `prefers-reduced-motion` (в этом режиме обратная связь остаётся, убирается только движение), `role="status"` для «Верно/Неверно», фокус-кольцо с контрастом не меньше 3:1, палитра проверена на контраст по WCAG (таблица в §5.6).

---

## 1. Что делает обучающее приложение «залипательным»: принципы juice

### 1.1. Откуда термин

- **«Juice it or lose it»** — доклад Мартина Йонассона и Петри Пурхо, 2012 ([YouTube](https://www.youtube.com/watch?v=Fy0aCDmgnxg) ✅ название проверено через oEmbed). Главная мысль: игра становится «сочной», когда на каждое действие отвечает множество мелких откликов. Это движение с «пружиной», частицы, звук, сжатие и растяжение, тряска. Механика при этом остаётся той же.
- **«The art of screenshake»** — доклад Яна Виллема Неймана (Vlambeer), INDIGO 2013 ([YouTube](https://www.youtube.com/watch?v=AJdEqssNZ-U) ✅). В нём перечислены приёмы game feel: отдача, вспышки, кадры-паузы при попадании, тряска. Тряску нужно дозировать.
- **Перевод на язык обучения.** Каждый клик получает отклик. Верный ответ — это маленький праздник. Ошибка — мягкий и не обидный сигнал. Конец урока — большой праздник. Важно не перегружать: NN/g напоминает, что чем чаще пользователь видит анимацию, тем короче и тише она должна быть ([NN/g, 2020](https://www.nngroup.com/articles/animation-duration/) ✅).

### 1.2. Что известно о Duolingo

Подробно это разобрано в отчёте [01-duolingo-teardown.md](01-duolingo-teardown.md). Здесь — только то, что относится к моушну.

| Элемент | Что известно | Статус |
|---|---|---|
| Персонажи на Rive, стейт-машины, реакция на ответ | Блог Duolingo о виземах | ✅ (см. 01) |
| «Timing is everything in animation»; несколько черновых проходов анимации, затем доводка ритма и энергии | [Hartfelder, 21.01.2022](https://blog.duolingo.com/streak-milestone-design-animation/) | ✅ |
| Фраза «у каждой анимации должен быть ритм (beat) даже без звука» | В посте Hartfelder её **нет** (проверено WebFetch). Похоже, она взята из поста саунд-дизайнера Duolingo в LinkedIn: там же описано наслоение звука и хаптики (хаптика даёт низы, звук — верха) | ⚠️ первоисточник не найден; в отчёте 01 атрибуция неточная |
| Кнопка: подложка 4px, радиус 16px, при нажатии опускается | Реконструкция [Crosley](https://blakecrosley.com/guides/design/duolingo). Автор не указывает, что это замеры, это иллюстративный CSS | 🔹 |
| Плашка ответа выезжает за 200 мс ease-out, прогресс-бар заполняется 300 мс ease-out, высота бара 16px | Там же | 🔹 |
| Пламя стрика «дышит»: 2 с, scale 1→1,05, rotate 0→2° | Там же | 🔹 |
| Взмах крыльев Duo при верном ответе, «конфетти из персонажей» в конце урока | [60fps.design, 29.12.2024](https://60fpsdesign.substack.com/p/fun-in-every-frame) | 🔹 |
| Тряска при ошибке, «искры» при верном ответе | Сторонние разборы микровзаимодействий | ⚠️ |

**Вывод.** Точных спецификаций Duolingo не публикует. Ниже наши собственные значения, опирающиеся на открытые стандарты (Material 3, NN/g, WCAG). Duolingo служит только ориентиром «по ощущению».

### 1.3. Пороги восприятия, на которые опираемся

- **0,1 с** — ощущение «мгновенно», **1 с** — мысль не прерывается, **10 с** — предел удержания внимания ([Nielsen, 1993/2014](https://www.nngroup.com/articles/response-times-3-important-limits/) ✅). → Проверка ответа и первая реакция (звук, цвет) должны укладываться в 100 мс. Всё считается локально, сеть не нужна.
- **100–500 мс** — обычный диапазон UI-анимаций. Около **100 мс** — для простой обратной связи (чекбокс, переключатель). **200–300 мс** — для крупных изменений экрана. **При 500 мс анимация «начинает тянуться»**. Появление делаем немного дольше исчезновения (например, 300 и 200–250 мс). По умолчанию ease-out, линейного движения избегаем ([Laubheimer, NN/g, 09.02.2020](https://www.nngroup.com/articles/animation-duration/) ✅).
- **Скелетоны.** Если загрузка короче 1 с, не показываем ни скелетон, ни спиннер. При 2–10 с — скелетон для страницы, спиннер для отдельного блока. Дольше 10 с — прогресс-бар с оценкой времени ([Tankala, NN/g, 2023](https://www.nngroup.com/articles/skeleton-screens/) ✅). У нас статический сайт: уроки — это локальный JSON, поэтому скелетоны нужны редко. Чаще всего хватит перехода между экранами (§3.8).

---

## 2. Моушн-токены

### 2.1. Длительности

За основу взяты токены Material 3 (`@material/web` 2.5.0, файл `tokens/versions/latest/sass/_md-sys-motion.scss` ✅): short1–4 = 50/100/150/200 мс, medium1–4 = 250/300/350/400 мс, long1–4 = 450/500/550/600 мс, extra-long1–4 = 700/800/900/1000 мс.

Наша сокращённая шкала:

| Токен | мс | Где применяем |
|---|---|---|
| `--dur-instant` | 50 | Смена цвета при нажатии, ripple |
| `--dur-press` | 100 | Кнопка вниз/вверх, выбор плитки (нажатие — 34 мс, как у Comeau, см. §3.2) |
| `--dur-fast` | 200 | Исчезновение плашки, тултипы |
| `--dur-base` | 300 | Появление плашки ответа, заполнение прогресса |
| `--dur-slow` | 450 | Переход между экранами, раскрытие карточки |
| `--dur-celebrate` | 800–1200 | Шаги финального экрана (счётчики, конфетти) |

### 2.2. Кривые (cubic-bezier)

| Токен | Значение | Источник | Применение |
|---|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | M3 `easing-standard` ✅ | Почти всё |
| `--ease-enter` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | M3 `emphasized-decelerate` ✅ | Появление: плашка, модалка, экран |
| `--ease-exit` | `cubic-bezier(0.3, 0, 0.8, 0.15)` | M3 `emphasized-accelerate` ✅ | Исчезновение |
| `--ease-overshoot` | `cubic-bezier(0.3, 0.7, 0.4, 1.5)` | [Comeau, 3D-кнопка](https://www.joshwcomeau.com/animation/3d-button/) ✅ | Подъём при наведении, «пружинка» |
| `--ease-release` | `cubic-bezier(0.3, 0.7, 0.4, 1)` | Comeau ✅ | Медленный возврат кнопки (600 мс) |

### 2.3. Пружины на чистом CSS: `linear()`

- `linear()` задаёт кривую ломаной по точкам, и значения больше 1 дают перелёт (overshoot). Поддержка: Chrome 113, Firefox 112, Safari 17.2; **Baseline Widely available с декабря 2023** ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear) ✅; данные `@mdn/browser-compat-data` 8.1.6 ✅).
- Ограничения ([Comeau](https://www.joshwcomeau.com/animation/linear-timing-function/) ✅):
  - длительность фиксирована;
  - если анимацию прервать, инерция не сохраняется (разворот получается резким);
  - нужно 40 и больше точек, иначе движение выглядит «роботизированным»;
  - фолбэк делается через переопределение переменной внутри `@supports`;
  - готовые генераторы: [Linear() Easing Generator](https://linear-easing-generator.netlify.app/) (Archibald и Argyle) и Easing Wizard.
- Для справки, пружины Material 3 Expressive (токены `@material/web` ✅): spatial default — damping 0,9, stiffness 700; fast — 0,9 и 1400; slow — 0,9 и 300; effects — damping 1 (без перелёта).

**Наши три пружины.** Мы получили их сами: моделировали затухающий осциллятор и упрощали кривую алгоритмом Рамера — Дугласа — Пекера с допуском 0,005 (скрипт в scratchpad, не в репозитории):

```css
:root {
  /* pop — значок «✓», бейдж комбо, выбранная плитка. ζ=0.5, 2.2 Гц → ~640 мс, перелёт 16 % */
  --spring-pop: linear(0, 0.008 1.5%, 0.036 3.2%, 0.078 4.8%, 0.140 6.7%, 0.280 10.0%, 0.717 19.3%, 0.827 22.0%, 0.921 24.7%, 0.995 27.2%, 1.055 29.7%, 1.101 32.2%, 1.134 34.8%, 1.162 39.5%, 1.155 44.7%, 1.129 49.3%, 1.021 64.2%, 0.981 74.5%, 0.975 86.7%, 0.991 99.8%, 1);
  --spring-pop-dur: 640ms;
  /* soft — плашка снизу, карточки, прогресс. ζ=0.8, 2.0 Гц → ~510 мс, перелёт 1,5 % */
  --spring-soft: linear(0, 0.006 1.8%, 0.024 3.7%, 0.057 5.8%, 0.103 8.2%, 0.199 12.2%, 0.521 24.3%, 0.612 28.2%, 0.692 32.0%, 0.808 38.8%, 0.893 45.8%, 0.934 50.5%, 0.965 55.3%, 1.003 66.3%, 1.015 83.2%, 1.010 99.8%, 1);
  --spring-soft-dur: 510ms;
  /* snappy — кнопки, чипы. ζ=1 (критическое затухание), 3.2 Гц → ~340 мс, без перелёта */
  --spring-snappy: linear(0, 0.020 3.2%, 0.084 7.0%, 0.162 10.5%, 0.443 22.0%, 0.605 29.8%, 0.716 36.8%, 0.805 44.3%, 0.883 54.0%, 0.937 65.3%, 0.968 77.5%, 0.991 99.8%, 1);
  --spring-snappy-dur: 340ms;
}
/* Фолбэк для старых браузеров: переопределяем переменную, а не повторяем transition (совет Comeau) */
@supports not (animation-timing-function: linear(0, 1)) {
  :root { --spring-pop: cubic-bezier(0.3, 0.7, 0.4, 1.5); --spring-soft: cubic-bezier(0.05, 0.7, 0.1, 1); --spring-snappy: cubic-bezier(0.2, 0, 0, 1); }
}
```

### 2.4. Хореография ответа: событие → длительность → кривая

| t, мс | Верный ответ | Неверный ответ |
|---|---|---|
| 0 | Нажатие «Проверить»: кнопка опускается (34 мс) | То же |
| 0–20 | Звук «дзынь» (§3.9), `vibrate(15)` | Мягкий «бум», `vibrate([30,60,30])` |
| 0–300 | Выбранная плитка становится зелёной, ✓ «выскакивает» (`--spring-pop`) | Плитка становится янтарной/красной и трясётся 400 мс, затухая (±8→±2 px) |
| 0–510 | Плашка выезжает снизу (`--spring-soft`), в ней «Верно!» и перевод | Плашка с **правильным ответом** и кнопкой «Понятно» |
| 100–550 | Прогресс-бар прибавляет шаг (`--spring-soft`), по нему пробегает блик (600 мс) | Прогресс не меняется, задание уходит в очередь «вернуться в конце» |
| ≥ 3 подряд | Бейдж «3 подряд!» (`--spring-pop`), бар окрашен градиентом «солнце», звук комбо выше на 2 полутона за шаг | Серия сбрасывается тихо: число просто гаснет, без «наказания» |
| сразу | `role="status"` объявляет «Верно. …», фокус переходит на «Продолжить» | Объявляется «Неверно. Правильный ответ: …» |

---

## 3. Готовые рецепты (CSS / JS)

> Все рецепты написаны без фреймворка и подойдут как для чистого JS, так и для Svelte, Preact или Vue.
> Движение подключается только в `@media (prefers-reduced-motion: no-preference)` («no-motion-first»), а обратная связь цветом, текстом и звуком работает всегда.

### 3.1. Базовые токены

```css
:root {
  color-scheme: light dark;
  /* палитра — см. §5.6 */
  --bg: #FBF7F0; --surface: #FFFFFF; --ink: #1F1A17; --muted: #5E5650; --line: #E6DED3;
  --red: #B3261E; --red-edge: #7F1A15; --red-soft: #FBE5E1;
  --green: #2A744A; --green-edge: #1C5233; --green-soft: #E3F2E8;
  --amber: #9A5B00; --amber-soft: #FCEFD9; --focus: #24609B;
  --radius: 16px;
  --font-head: "Rubik", "Nunito", system-ui, sans-serif;
  --font-text: "Nunito", "PT Sans", system-ui, sans-serif;
  --dur-press: 100ms; --dur-fast: 200ms; --dur-base: 300ms; --dur-slow: 450ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0.05, 0.7, 0.1, 1);
  --ease-exit: cubic-bezier(0.3, 0, 0.8, 0.15);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #141110; --surface: #1F1B19; --ink: #F4EFE7; --muted: #B9B0A6; --line: #3A332F;
    --red: #FF7A6B; --red-edge: #B3261E; --red-soft: #3A1A17;
    --green: #6FD39A; --green-edge: #2A744A; --green-soft: #16301F;
    --amber: #F5B657; --amber-soft: #352612; --focus: #8EC1F0;
  }
}
:root[data-theme="dark"] { /* ручной переключатель темы — те же значения */
  --bg: #141110; --surface: #1F1B19; --ink: #F4EFE7; --muted: #B9B0A6; --line: #3A332F;
  --red: #FF7A6B; --red-edge: #B3261E; --red-soft: #3A1A17;
  --green: #6FD39A; --green-edge: #2A744A; --green-soft: #16301F;
  --amber: #F5B657; --amber-soft: #352612; --focus: #8EC1F0;
}
/* В тёмной теме текст на «заливных» кнопках — тёмный: */
:root[data-theme="dark"] .btn:not(.btn--ghost):not(:disabled) { --fg: #141110; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .btn:not(.btn--ghost):not(:disabled) { --fg: #141110; } }
body { background: var(--bg); color: var(--ink); font: 400 1.0625rem/1.55 var(--font-text); }
```

### 3.2. «Объёмная» кнопка в духе Duolingo

Схема такая: подложка-«ребро» сделана через `box-shadow` и не сдвигает раскладку. Нажатие короткое (34 мс, как у [Comeau](https://www.joshwcomeau.com/animation/3d-button/) ✅), отпускание — медленный пружинистый возврат.

```css
.btn {
  --face: var(--green); --edge: var(--green-edge); --fg: #fff;
  appearance: none; border: 0; cursor: pointer;
  min-height: 48px; padding: 14px 24px; border-radius: var(--radius);
  font: 700 1rem/1 var(--font-head); letter-spacing: .04em; text-transform: uppercase;
  color: var(--fg); background: var(--face);
  box-shadow: 0 4px 0 var(--edge);
  transform: translateY(0);
  -webkit-tap-highlight-color: transparent; user-select: none;
}
@media (prefers-reduced-motion: no-preference) {
  .btn { transition: transform 600ms cubic-bezier(0.3, 0.7, 0.4, 1), box-shadow 600ms cubic-bezier(0.3, 0.7, 0.4, 1), filter 150ms; }
  .btn:hover { transform: translateY(-1px); box-shadow: 0 5px 0 var(--edge); transition-duration: 250ms; transition-timing-function: cubic-bezier(0.3, 0.7, 0.4, 1.5); }
}
.btn:hover { filter: brightness(1.06); }
.btn:active { transform: translateY(4px); box-shadow: 0 0 0 var(--edge); transition-duration: 34ms; }
.btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
.btn:disabled { --face: var(--line); --edge: #CFC6BA; --fg: var(--muted); cursor: not-allowed; filter: none; }
.btn--ink   { --face: var(--ink);   --edge: #000; --fg: var(--surface); } /* нейтральная «Проверить» */
.btn--red   { --face: var(--red);   --edge: var(--red-edge); }
.btn--ghost { --face: var(--surface); --edge: var(--line); --fg: var(--ink); border: 2px solid var(--line); }
```

**Плитки вариантов ответа** — та же логика: рамка 2px, «ребро» 4px, при выборе меняется цвет и плитка «выскакивает».

```css
.tile { border: 2px solid var(--line); border-radius: var(--radius); background: var(--surface);
        box-shadow: 0 4px 0 var(--line); padding: 14px 16px; text-align: left; }
.tile[aria-pressed="true"] { border-color: var(--focus); box-shadow: 0 4px 0 var(--focus); }
.tile.is-correct { border-color: var(--green); background: var(--green-soft); box-shadow: 0 4px 0 var(--green); }
.tile.is-wrong   { border-color: var(--red);   background: var(--red-soft);   box-shadow: 0 4px 0 var(--red); }
@media (prefers-reduced-motion: no-preference) {
  .tile.is-correct { animation: pop var(--spring-pop-dur) var(--spring-pop); }
  .tile.is-wrong   { animation: shake 400ms var(--ease-standard); }
}
@keyframes pop   { from { transform: scale(.92); } to { transform: scale(1); } } /* перелёт даёт сама пружина */
@keyframes shake { 0%,100% { transform: translateX(0) } 15% { transform: translateX(-8px) } 30% { transform: translateX(7px) }
                   45% { transform: translateX(-5px) } 60% { transform: translateX(4px) } 75% { transform: translateX(-2px) } }
```

### 3.3. Плашка обратной связи снизу

```html
<section class="sheet" id="feedback" aria-labelledby="fb-title" hidden>
  <div class="sheet__icon" aria-hidden="true"></div>
  <h2 id="fb-title" class="sheet__title"></h2>
  <p class="sheet__body"></p>
  <button class="btn" id="fb-continue">Продолжить</button>
</section>
<div id="sr-status" class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"></div>
```

```css
.sheet { position: fixed; inset: auto 0 0 0; padding: 16px 24px calc(16px + env(safe-area-inset-bottom));
         border-radius: 16px 16px 0 0; background: var(--green-soft); color: var(--ink); }
.sheet.is-wrong { background: var(--red-soft); }
.sheet.is-wrong .btn { --face: var(--red); --edge: var(--red-edge); }
@media (prefers-reduced-motion: no-preference) {
  .sheet:not([hidden]) { animation: sheet-in var(--spring-soft-dur) var(--spring-soft); }
  .sheet:not([hidden]) .sheet__icon { animation: pop var(--spring-pop-dur) var(--spring-pop) 80ms both; }
}
@keyframes sheet-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
.visually-hidden { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
```

```js
function showFeedback({ ok, title, body }) {
  const sheet = document.getElementById('feedback');
  sheet.classList.toggle('is-wrong', !ok);
  sheet.querySelector('.sheet__title').textContent = title;          // «Верно!» / «Почти!»
  sheet.querySelector('.sheet__body').textContent = body;            // перевод / правильный ответ
  sheet.hidden = false;
  announce(`${ok ? 'Верно' : 'Неверно'}. ${body}`);                   // экранный диктор
  ok ? (sfx.correct(), haptic.correct()) : (sfx.wrong(), haptic.wrong());
  document.getElementById('fb-continue').focus({ preventScroll: true });
}
function announce(text) {             // live-регион есть в DOM заранее, меняем только текст
  const live = document.getElementById('sr-status');
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = text; });  // чтобы повтор той же фразы тоже прочитали
}
```

- Для элементов, которые вставляются в DOM (тосты, бейджи), можно обойтись без JS и задать начальное состояние через `@starting-style`. Поддержка: Chrome 117, Firefox 129, Safari 17.5 ✅ (BCD).

### 3.4. Прогресс-бар урока, блик и комбо

```html
<div class="progress" role="progressbar" aria-label="Прогресс урока" aria-valuemin="0" aria-valuemax="10" aria-valuenow="3" style="--p:.3">
  <div class="progress__fill"></div>
</div>
<div class="combo" aria-hidden="true">3 подряд!</div>
```

```css
.progress { height: 16px; border-radius: 999px; background: var(--line); overflow: hidden; }
.progress__fill { position: relative; height: 100%; width: calc(var(--p) * 100%); border-radius: inherit; background: var(--green); }
.progress__fill::before { /* «глянцевая» полоска сверху — блик */
  content: ""; position: absolute; left: 8px; right: 8px; top: 3px; height: 4px; border-radius: 999px; background: rgb(255 255 255 / .35); }
.progress.is-combo .progress__fill { background: linear-gradient(90deg, var(--amber), var(--red)); } /* «солнце» — серия */
@media (prefers-reduced-motion: no-preference) {
  .progress__fill { transition: width var(--spring-soft-dur) var(--spring-soft), background-color var(--dur-base); }
  .progress__fill::after { /* пробегающий блеск после верного ответа */
    content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 30%, rgb(255 255 255 / .55) 50%, transparent 70%);
    transform: translateX(-100%); }
  .progress.just-advanced .progress__fill::after { animation: shine 600ms var(--ease-standard); }
  .combo.is-visible { animation: pop var(--spring-pop-dur) var(--spring-pop); }
}
@keyframes shine { to { transform: translateX(100%); } }
```

- Мы анимируем `width` маленького элемента: это дёшево. Для больших блоков используйте `transform` или `clip-path`.
- `aria-valuenow` обновляйте вместе с `--p`. Бейдж комбо для диктора скрыт: о серии сообщает `announce()`, например «Три подряд».

### 3.5. Финальный экран урока: конфетти, счётчики, «лесенка»

```js
import confetti from 'canvas-confetti'; // ISC, 1.9.4
// Конфетти-«звёздочки» толэзе: та же геометрия, что на флаге (§5.2)
const tolezhe = confetti.shapeFromPath({ path: 'M50 0 L150 100 L0 100 L100 0 L100 150 L0 50 L150 50 L50 150 Z' });

export function celebrate() {
  confetti({
    particleCount: 120, spread: 70, startVelocity: 45, origin: { y: 0.7 },
    colors: ['#DD2211', '#1F1A17', '#FFFFFF', '#2A744A'],  // флаг + «ель»
    shapes: [tolezhe, 'square'], scalar: 1.1,
    disableForReducedMotion: true,                          // по умолчанию false — включаем явно
  });
  sfx.complete();
}
function countUp(el, to, ms = 800) {           // XP, точность, время
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = to; return; }
  const t0 = performance.now(), ease = t => 1 - (1 - t) ** 3;
  requestAnimationFrame(function step(now) {
    const t = Math.min(1, (now - t0) / ms);
    el.textContent = Math.round(to * ease(t));
    if (t < 1) requestAnimationFrame(step);
  });
}
```

```css
.stats { font-variant-numeric: tabular-nums; } /* у Rubik есть tnum, цифры не «прыгают» */
@media (prefers-reduced-motion: no-preference) {
  .stats > .card { animation: rise 450ms var(--ease-enter) both; }
  .stats > .card:nth-child(2) { animation-delay: 80ms; }
  .stats > .card:nth-child(3) { animation-delay: 160ms; }
}
@keyframes rise { from { opacity: 0; transform: translateY(12px) scale(.98); } }
```

- Параметры по умолчанию в `canvas-confetti` ([README](https://github.com/catdad/canvas-confetti) ✅): particleCount 50, spread 45, startVelocity 45, decay 0,9, gravity 1, ticks 200, origin {0.5, 0.5}, zIndex 100, `disableForReducedMotion: false`. Через `confetti.create(canvas, {useWorker: true})` отрисовку можно вынести в воркер.
- Порядок экрана итогов: конфетти и звук → «+N XP» (счётчик) → точность и время (лесенкой по 80 мс) → «Новых слов: N» → кнопка «Продолжить». Это ориентир по Duolingo, см. отчёт 01 🔹.

### 3.6. Путь уроков: плавная SVG-кривая, «нитка» и вышивка

Узлы стоят столбиком и смещаются по синусоиде. Так выглядит путь Duolingo: ⚠️ это наше наблюдение, а не спецификация. Через узлы проводим гладкую кривую Catmull-Rom, переведённую в кубические Безье. Пройденная часть — красная «нить», будущая — серый «стежок».

```js
export function nodePositions(n, { width = 320, gapY = 96, amp = 72, period = 8, top = 48 } = {}) {
  return Array.from({ length: n }, (_, i) => ({ x: width / 2 + amp * Math.sin(i / period * 2 * Math.PI), y: top + i * gapY }));
}
export function smoothPath(p, k = 1) {               // Catmull-Rom → cubic Bézier
  if (p.length < 2) return '';
  let d = `M ${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6 * k, y: p1.y + (p2.y - p0.y) / 6 * k };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6 * k, y: p2.y - (p3.y - p1.y) / 6 * k };
    d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}
// done = узлы 0..current, todo = current..end
```

```html
<svg class="path" viewBox="0 0 320 1000" aria-hidden="true">
  <path class="path__todo" d="…"/>
  <path class="path__done" d="…" pathLength="1"/>
</svg>
<ol class="nodes"><!-- настоящие <a>/<button> поверх SVG: доступны с клавиатуры --></ol>
```

```css
.path__todo { fill: none; stroke: var(--line); stroke-width: 6; stroke-linecap: round; stroke-dasharray: 10 12; } /* «стежок» */
.path__done { fill: none; stroke: var(--red);  stroke-width: 6; stroke-linecap: round; }
@media (prefers-reduced-motion: no-preference) {
  .path__done.is-growing { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 900ms var(--ease-enter) forwards; }
  .node.just-unlocked { animation: pop var(--spring-pop-dur) var(--spring-pop); }
  .node--current::after { content: ""; position: absolute; inset: -8px; border-radius: 50%; border: 3px solid var(--red);
                          animation: ring 2s var(--ease-standard) infinite; }
}
@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes ring { from { transform: scale(.9); opacity: .9; } to { transform: scale(1.35); opacity: 0; } }
```

- `pathLength="1"` нормирует длину пути, поэтому `stroke-dasharray: 1` и `stroke-dashoffset: 1→0` работают при любой фактической длине.
- Маскот может «идти» по пути через CSS `offset-path: path('…')` и `offset-distance`: поддержка Chrome 55 / Firefox 72 / Safari 15.4–16 ✅ (BCD). Другой вариант — JS-функция `getPointAtLength()` (Safari 12+).
- Прорисовку пути при прокрутке можно включить как прогрессивное улучшение через `animation-timeline: view()`: Chrome 115, Safari 26, в Firefox пока только preview ✅ (BCD). Без поддержки путь просто виден целиком.
- **Наша фишка.** Под каждым пройденным юнитом появляется полоса орнамента. Мотив за мотивом её «вышивают» уроки юнита: анимация `stroke-dashoffset` по контурам мотива, 300 мс на мотив, лесенкой. Подробнее в §5.5.

### 3.7. Переходы между экранами (View Transitions API)

Поддержка (MDN BCD 8.1.6 от 15.10.2026 ✅):

| Возможность | Chrome / Edge | Firefox | Safari (macOS и iOS) |
|---|---|---|---|
| `document.startViewTransition()` (SPA) | 111 | 144 | 18 |
| `startViewTransition({update, types})` и `ViewTransition.types` | 125 | 147 | 18.2 |
| `view-transition-class` | 125 | 144 | 18.2 |
| `@view-transition { navigation: auto }` (MPA, между страницами) | 126 | ✗ | 18.2 |
| `pageswap` / `pagereveal` | 124 / 123 | ✗ | 18.2 |

**SPA-вариант** (одна страница с роутером):

```js
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const hasTypes = typeof ViewTransition !== 'undefined' && 'types' in ViewTransition.prototype;
export function go(render, type = 'forward') {        // type: forward | back | lesson-start | lesson-end
  if (!document.startViewTransition || reduce.matches) return render();
  return hasTypes ? document.startViewTransition({ update: render, types: [type] })
                  : document.startViewTransition(render);
}
```

```css
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 280ms; animation-timing-function: var(--ease-standard); }
html:active-view-transition-type(forward)::view-transition-old(root) { animation-name: vt-out-left; }
html:active-view-transition-type(forward)::view-transition-new(root) { animation-name: vt-in-right; }
html:active-view-transition-type(back)::view-transition-old(root)    { animation-name: vt-out-right; }
html:active-view-transition-type(back)::view-transition-new(root)    { animation-name: vt-in-left; }
@keyframes vt-out-left  { to   { opacity: 0; transform: translateX(-24px); } }
@keyframes vt-in-right  { from { opacity: 0; transform: translateX(24px); } }
@keyframes vt-out-right { to   { opacity: 0; transform: translateX(24px); } }
@keyframes vt-in-left   { from { opacity: 0; transform: translateX(-24px); } }
.lesson-hero { view-transition-name: lesson-hero; }  /* узел пути «раскрывается» в шапку урока */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
}
```

**MPA-вариант** (отдельные HTML-страницы на GitHub Pages):
- На обеих страницах достаточно правила `@view-transition { navigation: auto; }` ✅.
- Работает только между страницами одного origin. У нас всё лежит на `depthd.github.io`, так что условие выполняется.
- Переход отменяется, если навигация длится дольше ~4 с ([Chrome docs](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document) ✅).
- В Firefox страницы просто сменятся без анимации — это нормальная деградация.

### 3.8. Звуки без файлов: WebAudio-синтез

Автоплей: AudioContext, созданный до жеста пользователя, будет в состоянии `suspended`. Его нужно возобновить через `resume()` в обработчике клика ([Chrome autoplay](https://developer.chrome.com/blog/autoplay) ✅). Поэтому контекст создаём лениво, при первом нажатии.

```js
// sfx.js — «дзынь», «бум», комбо, фанфара; ~1 КБ, без аудиофайлов
let ctx, out;
function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    out = ctx.createGain(); out.gain.value = 0.25;                     // общий уровень — тихо
    const comp = ctx.createDynamicsCompressor();                        // аккорды не клиппят
    out.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone({ f, type = 'sine', at = 0, dur = 0.15, gain = 0.5, attack = 0.005, to = null }) {
  const c = ac(), t0 = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);       // «падение» высоты для «бум»
  g.gain.setValueAtTime(0.0001, t0);                                    // exp-рампа не умеет 0
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(out); o.start(t0); o.stop(t0 + dur + 0.02);
}
export const sfx = {
  on: true,
  tap()      { this.on && tone({ f: 660, type: 'triangle', dur: 0.05, gain: 0.2 }); },
  correct()  { if (!this.on) return;                                    // C6 → G6 + «блеск»
    tone({ f: 1046.5, dur: 0.12 }); tone({ f: 1568, at: 0.07, dur: 0.25 }); tone({ f: 3136, at: 0.07, dur: 0.18, gain: 0.08 }); },
  wrong()    { if (!this.on) return;                                    // мягкий низкий «бум» вниз
    tone({ f: 220, to: 110, type: 'triangle', dur: 0.22, gain: 0.45 }); tone({ f: 207.65, to: 98, at: 0.09, dur: 0.25, gain: 0.3 }); },
  combo(n)   { if (!this.on) return; const f = 880 * 2 ** (Math.min(n, 8) * 2 / 12);   // +2 полутона за шаг серии
    tone({ f, dur: 0.12, gain: 0.4 }); tone({ f: f * 1.5, at: 0.06, dur: 0.18, gain: 0.3 }); },
  complete() { if (!this.on) return;                                    // арпеджио C5–E5–G5–C6
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ f, type: 'triangle', at: i * 0.09, dur: 0.3, gain: 0.4 })); },
};
```

- **Настройки:** «Звуки: вкл/выкл» сохраняем в `localStorage`. Звучит только то, что вызвано действием пользователя, фоновой музыки нет.
- **iOS:** в Safari 16.4+ есть экспериментальный `navigator.audioSession` ✅ (BCD, experimental). Если выставить `type = 'ambient'`, короткие эффекты будут, предположительно, микшироваться с музыкой пользователя, а не прерывать её. ⚠️ Поведение надо проверить на устройстве.
- **Готовая альтернатива:** ZzFX — микросинтезатор эффектов, MIT, `ZzFXMicro.min.js` весит 1226 байт ✅ (npm 1.4.0). Подойдёт, если захочется больше «8-битных» звуков без своего кода.
- **Произношение удмуртских слов** должно быть в записи (mp3/ogg/opus), его синтезировать нельзя: браузерного TTS для удмуртского, по данным отчёта 01, нет.

### 3.9. Вибрация (тактильный отклик)

- `navigator.vibrate(ms | [вибрация, пауза, …])`. Вызов `0` или `[]` отменяет вибрацию ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) ✅).
- Поддержка: Chrome и Android с 32-й версии; **с Chrome 60 нужен жест пользователя**, иначе вызов вернёт `false`. В кросс-доменных iframe не работает (Chrome 55+, Firefox 72+). **Safari, включая iOS, не поддерживает** ✅ (BCD).
- Обходной путь для iOS: `<input type="checkbox" switch>` (Safari 17.4+, [WebKit, 28.02.2024](https://webkit.org/blog/15054/an-html-switch-control/) ✅) при переключении даёт системную хаптику. Этим пользуется библиотека `ios-haptics` (MIT, 3.2.0). WebKit сам о хаптике в посте **не пишет** ⚠️, это недокументированный трюк, и его могут убрать. Ставить его в приоритет не стоит.

```js
const can = 'vibrate' in navigator;
export const haptic = {
  on: true,
  tap()     { this.on && can && navigator.vibrate(10); },
  correct() { this.on && can && navigator.vibrate(15); },
  wrong()   { this.on && can && navigator.vibrate([30, 60, 30]); },
  combo()   { this.on && can && navigator.vibrate([10, 30, 10, 30, 20]); },
};
```

### 3.10. `prefers-reduced-motion`: что убираем и что оставляем

- Медиазапрос поддерживается везде: Chrome 74, Firefox 63, Safari 10.1 ✅ (BCD).
- По WCAG 2.3.3 «Animation from Interactions» (уровень AAA) анимацию движения, вызванную взаимодействием, должно быть можно отключить, если она не существенна. Способы: техника C39 (CSS `prefers-reduced-motion`), SCR40 (то же в JS) или собственная настройка ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) ✅).
- **Убираем:** тряску, прыжки и масштабирование, конфетти, параллакс, пробегающий блик, бесконечные пульсации, слайды переходов. Цвет при этом меняется мгновенно или через короткий кроссфейд.
- **Оставляем:** смену цвета, иконки ✓/✗, текст, звук и вибрацию (у них отдельные переключатели), перемещение фокуса и объявления для диктора. Обратная связь не должна пропадать.
- Модель «no-motion-first»: всё движение пишем внутри `@media (prefers-reduced-motion: no-preference)`. Так забытая анимация не «протечёт» к тем, кто просил меньше движения. На сайте нужен и свой переключатель «Меньше анимации» (`html[data-motion="reduce"]`): так рекомендует WCAG.

```js
const rm = matchMedia('(prefers-reduced-motion: reduce)');
export let reduceMotion = rm.matches || localStorage.motion === 'reduce';
rm.addEventListener('change', e => { reduceMotion = e.matches || localStorage.motion === 'reduce'; });
```

### 3.11. Доступность: контраст, фокус, клавиатура, live-регионы

- **Контраст** (WCAG 2.2 AA): обычный текст — 4,5:1, крупный (от 24px, или от 18,66px жирным) — 3:1 ([1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)). Границы и иконки интерактивных элементов, сегменты прогресса — 3:1 ([1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). Наша палитра проверена в §5.6.
- **Цвет — не единственный признак** ([1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)): у верного ответа всегда есть ✓ и текст «Верно!», у неверного — ✗ и правильный вариант.
- **Фокус:** `:focus-visible` поддерживается в Chrome 86, Firefox 85, Safari 15.4 ✅ (BCD). Кольцо 3px с отступом 3px, цвет `--focus` с контрастом к фону 6,1:1 в светлой теме и 9,9:1 в тёмной. Это перекрывает требование 2.4.13 Focus Appearance (AAA): площадь не меньше периметра в 2px и контраст «фокус против без фокуса» от 3:1 ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) ✅).
- **Сообщения о статусе** ([4.1.3, AA](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)):
  - `role="status"` равен `aria-live="polite"`, а `role="alert"` — assertive;
  - регион должен существовать в DOM до изменения;
  - `aria-atomic="true"` заставляет читать сообщение целиком;
  - `assertive` используем только когда прерывание действительно необходимо ([MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live) ✅). Для «Верно/Неверно» хватает `polite` вместе с переносом фокуса на «Продолжить».
- **Клавиатура:** Enter — «Проверить», затем «Продолжить»; цифры 1–9 выбирают вариант. У веб-версии Duolingo такое поведение есть, но это ⚠️ наблюдение. Узлы пути — настоящие ссылки или кнопки, SVG помечен `aria-hidden`.
- **Язык текста:** удмуртские фрагменты оборачиваем в `<span lang="udm">`. Это правильная разметка (ISO 639 `udm`), но как поведут себя дикторы без удмуртского голоса, неизвестно ⚠️, нужно проверить. Переносы `hyphens: auto` для `udm` словарём не поддержаны, поэтому ставим `hyphens: manual`.

---

## 4. Библиотеки анимации: что брать и когда

Версии и лицензии взяты из npm registry, размеры мы **измерили сами**: скачали файлы с jsDelivr и сжали `gzip -9` и brotli 11 (21.10.2026).

| Библиотека | Версия | Лицензия | Размер (что мерили) | gzip | brotli | Когда нужна |
|---|---|---|---|---|---|---|
| **CSS + Web Animations API** | — | — | встроено (`Element.animate` — Chrome 36, Firefox 48, Safari 13.1 ✅) | 0 | 0 | **По умолчанию.** Кнопки, плашки, тряска, прогресс, путь |
| **Motion** (motion.dev) | 14.5.0 | MIT | По документации: `animate` mini — **3,2 КБ**, hybrid — **22 КБ** ([docs](https://motion.dev/docs/animate) ✅); полный UMD `dist/motion.js` 172 КБ | 57 КБ (UMD) | 51 КБ (UMD) | Если нужны пружины с сохранением скорости при прерывании (drag карточек, жесты). В JS пружина задаётся через `stiffness` (по умолчанию 1), `damping` (10), `mass` (1), `bounce` (0,25) или `visualDuration` |
| **GSAP** | 3.15.0 | **Проприетарная** «Standard 'no charge' license» — бесплатно для всех благодаря Webflow ([gsap.com](https://gsap.com/standard-license) ✅); ограничения ⚠️ не изучены | `gsap.min.js` 72,9 КБ, MotionPathPlugin 22 КБ, DrawSVGPlugin 4,4 КБ | 28,3 / 9,7 / 2,2 КБ | 25,7 / 8,8 / 1,9 КБ | Сложные таймлайны, морфинг SVG, ScrollTrigger. Нам скорее избыточен, к тому же лицензия не OSI |
| **anime.js** | 4.5.0 | MIT | `anime.esm.min.js` 118,7 КБ (v4 модульная, есть `animejs/svg`: `createDrawable`, `createMotionPath`, `morphTo` ✅) | 40,9 КБ (весь бандл) | 36,4 КБ | Если нужны таймлайны и SVG-утилиты с MIT. После tree-shaking выйдет меньше ⚠️ (не мерили) |
| **@formkit/auto-animate** | 0.10.0 | MIT | `index.min.js` 8,4 КБ; по умолчанию 250 мс, сам отключается при reduced motion ✅ (код и [сайт](https://auto-animate.formkit.com/)) | 3,3 КБ | 2,9 КБ | Списки, где элементы добавляются и удаляются: «банк слов», очередь ошибок, лидерборд группы. Одна строка кода |
| **Svelte transitions** | svelte 5.57.2 | MIT | Встроены во фреймворк: `fade`, `fly`, `slide`, `scale`, `blur`, `draw` (SVG), `crossfade`; `svelte/motion` содержит `Spring` и `Tween` (5.8+) и `prefersReducedMotion` (5.7+) ✅ ([docs](https://svelte.dev/docs/svelte/svelte-motion)) | — | — | Если сайт будет на Svelte, отдельная библиотека анимации почти не нужна |
| **canvas-confetti** | 1.9.4 | ISC | `confetti.browser.js` 24,9 КБ | 6,9 КБ | 6,0 КБ | **Берём.** Конфетти, `shapeFromPath` (свои фигуры), `disableForReducedMotion`, воркер |
| js-confetti | 0.13.1 | MIT | 8,2 КБ | 2,8 КБ | 2,5 КБ | Ещё легче, есть конфетти-эмодзи. Своих фигур-путей нет ⚠️ |
| **Lottie** (lottie-web) | 5.13.0 | MIT | `lottie_light.min.js` 168 КБ, полный `lottie.min.js` 306 КБ | 46 / 76 КБ | 40 / 64 КБ | Готовые анимации из After Effects или LottieFiles. Для нас тяжеловато |
| dotLottie web | 0.81.0 | MIT | `dotlottie-player.wasm` 1,24 МБ | 496 КБ | 388 КБ | Только если появится много Lottie-файлов |
| **Rive** (`@rive-app/canvas`) | 2.45.0 | MIT (рантайм) | `rive.wasm` 2,1 МБ + `rive.js` 576 КБ | 866 + 126 КБ | 690 + 105 КБ | Персонаж со стейт-машиной, как у Duolingo. Брать позже |
| Rive lite (`@rive-app/canvas-lite`) | 2.45.0 | MIT | `rive.wasm` 792 КБ + `rive.js` 492 КБ | 324 + 110 КБ | 257 + 90 КБ | Облегчённый рантайм. Набор поддерживаемых функций ⚠️ не сверяли |

**Рекомендация.**
- MVP делаем на **чистом CSS и WAAPI** плюс **canvas-confetti**: суммарно около 6 КБ.
- Если списки «прыгают», добавляем **auto-animate** (+3 КБ).
- Если понадобятся жесты и пружины с инерцией, берём **Motion mini** (+3,2 КБ).
- Маскота сначала делаем на SVG и CSS (4 состояния, см. §5.7). На **Rive** (≥0,35 МБ br в lite) переходим, только когда появится аниматор и понадобится стейт-машина.

---

## 5. Визуальная идентичность на основе удмуртской культуры

### 5.1. Официальная символика: факты

- **Флаг Удмуртской Республики** ([ru.wikipedia](https://ru.wikipedia.org/wiki/Флаг_Удмуртии) ✅):
  - учреждён 04.11.1993, Положение о флаге принято 03.12.1993; автор — Ю. Н. Лобанов; пропорции 1:2;
  - три равные вертикальные полосы: **чёрная, белая, красная** (от древка);
  - в центре белой полосы — **красный восьмиконечный солярный знак**.
- **Официальное толкование цветов** (там же ✅):
  - чёрный — «символ земли и стабильности»;
  - красный — «цвет солнца и символ жизни»;
  - белый — «символ космоса и чистоты нравственных устоев»;
  - знак — «оберег… по преданию оберегает человека от несчастий».
- **Геометрия знака** по Положению (там же ✅):
  - вписан в квадрат со стороной 5/6 ширины полосы;
  - ширина «перекладин» — 1/3 стороны квадрата;
  - каждая перекладина заканчивается двумя зубцами, внутренние стороны которых образуют угол 90°, а вершина угла углублена к центру на 1/2 ширины перекладины.
- **Hex в файле Wikimedia** `Flag_of_Udmurtia.svg` ✅: чёрный `#000` (по умолчанию), белый `#fff`, красный **`#d21`** (= `#DD2211`). Знак записан как многоугольник `245,60 345,160 195,160 295,60 295,210 195,110 345,110 245,210`.
  - Мы сдвинули его в квадрат 150×150 и отрисовали с правилом заливки nonzero. Получился в точности «крест с раздвоенными концами»: ширина перекладины 50 = 1/3, глубина выреза 25 = 1/2 перекладины, угол 90°.
  - Официальных Pantone или RGB для цветов флага мы не нашли ⚠️. `#DD2211` — это значение конкретного SVG-файла.
- **Герб Удмуртской Республики** ([ru.wikipedia](https://ru.wikipedia.org/wiki/Герб_Удмуртской_Республики) ✅):
  - принят 26.04.1994, действующий закон — № 52-РЗ от 18.09.2002; автор — Ю. Н. Лобанов;
  - круглый красно-чёрный щит, на нём **белый лебедь (человек-птица)** с раскрытыми крыльями (на каждом крыле 26 перьев, в хвосте 8);
  - на груди лебедя — красный солярный знак, над крыльями — два малых белых знака;
  - лебедь — «символ возрождения, мудрости, мужества и совершенства», его основа — мифология удмуртского, русского, татарского и других народов республики;
  - большой знак — «земное воплощение оберегающих сил», малые — «космическое».

```svg
<!-- Толэзе / солярный знак флага, геометрия по Положению; fill-rule по умолчанию (nonzero) -->
<svg viewBox="0 0 150 150" aria-hidden="true"><polygon fill="currentColor" points="50,0 150,100 0,100 100,0 100,150 0,50 150,50 50,150"/></svg>
```

> **Правовой и этический момент.**
> - По п. 6 ст. 1259 ГК РФ государственные символы и знаки не являются объектами авторского права ⚠️: норму мы помним, но текст в этой сессии не открывали, юристу стоит перепроверить.
> - Порядок использования флага и герба регулируется законами УР.
> - **Рекомендация:** не делать флаг или герб логотипом и игровым элементом. Использовать **цвета и мотив знака** как часть собственного орнамента, а сам герб показывать только в разделе «О языке и республике» как иллюстрацию.

### 5.2. Знак толэзе — «лунный узор»

Главный источник — **Н. И. Шутова, «История происхождения и семантика лунного знака толезе»**, Вестник Удмуртского университета. История и филология, 2015, т. 25, вып. 4 ([PDF, journals.udsu.ru](https://journals.udsu.ru/history-philology/article/download/3596/3533) ✅):

- Удмуртская восьмиконечная звезда **толезе** — это «лунный узор». Сегодня он изображён на гербе и флаге и трактуется как восьмиконечный солярный знак-оберег.
- Вышивка толезе была **главным, центральным элементом свадебного нагрудника кабачи у удмуртов-ватка**: его надевали невесте по приезде в дом жениха. Обычно узор вышивали **шёлком насыщенного кирпично-красного цвета**. В одном случае знаки вышиты серебром на глубоком чёрном фоне, «как Луна на ночном небе».
- Чаще всего лунным узором пользовались **северные удмурты**. Им украшали концы полотенчатых головных уборов, косынки, нагрудники, подолы рубах, тканые пояса, края рукавов, а также ковры, прялки и резные изголовья.
- Знак связан с женской сферой: свадьбой, рождением и воспитанием детей. Он символизирует счастье, благополучие, изобилие и плодородие.
- В ru.wikipedia знак назван «толэзё», а в геральдике его иногда называют «удмуртской звездой» ([Октаграмма](https://ru.wikipedia.org/wiki/Октаграмма) ✅).
- Родственное слово *толэзь* — «месяц, луна» ([ru.wiktionary](https://ru.wiktionary.org/wiki/толэзь) ✅). Мы используем написание из статьи, «толезе/толэзе». Как точно пишется название знака по-удмуртски, ⚠️ уточнить у носителя или преподавателя.

**Как использовать уважительно:**
- знак — «награда» и «праздник»: конфетти, бейдж «урок пройден», полоса орнамента за юнит;
- **никогда** не ставить его на ошибки, потери и штрафы;
- не «ломать» знак в шуточных анимациях: не разрывать, не превращать в персонажа.

### 5.3. Костюм и вышивка: север и юг

По [ru.wikipedia, «Удмурты»](https://ru.wikipedia.org/wiki/Удмурты) ✅:

- **Северо-удмуртский женский костюм:**
  - рубаха *дэрем* с прямыми рукавами и съёмным нагрудником, халат *шортдэрем*, опояска;
  - на рубашку под камзол пристёгивается красный матерчатый нагрудник;
  - **одежда белая**.
- **У южных удмуртов** белая одежда была ритуальной, а повседневная — цветной и украшенной. Высокий берестяной головной убор **айшон** встречается на юге.
- **Украшения:** у северных удмуртов преобладали **вышивка, бисер, бусы**, у южных — монеты.
- **Орнамент:**
  - «Орнамент — **геометрический**, преобладали цвета **красный, коричневый, чёрный, фон — белый**»;
  - вышивали на холсте шерстяными (гарусными), шёлковыми и хлопковыми нитками, а также мишурой;
  - у южных удмуртов под тюркским влиянием вышивка более многоцветная;
  - в XIX веке вышивку постепенно сменяет узорное ткачество, а узорное вязание (чулки, варежки) живо до сих пор.
- **Глазов** (удм. *Глаз кар*) стоит на северо-западе Удмуртии, на левом берегу Чепцы. По переписи 2020 года удмурты составляют 22,4 % населения ([ru.wikipedia](https://ru.wikipedia.org/wiki/Глазов) ✅). Значит, «наша» эстетика — **северная**: белый холст и красная геометрическая вышивка.

### 5.4. Мотивы и слова (проверены по словарю)

| Мотив | Удмуртское слово | Источник | Как используем |
|---|---|---|---|
| Солнце | *шунды* | [ru.wiktionary](https://ru.wiktionary.org/wiki/шунды) ✅ | Цвет серии и XP; красный на флаге — «цвет солнца» |
| Луна, месяц | *толэзь* | [ru.wiktionary](https://ru.wiktionary.org/wiki/толэзь) ✅ | Тёмная тема — «ночь», серебристый толэзе на чёрном (как в вышивке у Шутовой) |
| Звезда | *кизили* | [ru.wiktionary](https://ru.wiktionary.org/wiki/кизили) ✅ | Рейтинг и «звёзды» за урок |
| Лебедь | *юсь* | [ru.wiktionary](https://ru.wiktionary.org/wiki/юсь) ✅ | Маскот |
| Ель | *кыз* | [ru.wiktionary](https://ru.wiktionary.org/wiki/кыз) ✅ | Зелёный цвет успеха («ель») и иллюстрации леса |
| Пельмени | *пельнянь* (*пель* «ухо» + *нянь* «хлеб») | [ru.wiktionary](https://ru.wiktionary.org/wiki/пельнянь) ✅, [ru.wikipedia](https://ru.wikipedia.org/wiki/Пельмени) (Фасмер) ✅ | Второй персонаж для аудирования: «ухо» |
| Перепечи | *перепеч* | [ru.wiktionary](https://ru.wiktionary.org/wiki/перепеч) ✅ | Иллюстрации к теме «еда» |
| Цвета | *тӧдьы* «белый», *сьӧд* «чёрный», *горд* «красный», *вож* «зелёный», *лыз* «голубой, синий» | ru.wiktionary: [тӧдьы](https://ru.wiktionary.org/wiki/тӧдьы), [сьӧд](https://ru.wiktionary.org/wiki/сьӧд), [горд](https://ru.wiktionary.org/wiki/горд), [вож](https://ru.wiktionary.org/wiki/вож), [лыз](https://ru.wiktionary.org/wiki/лыз) ✅ | Имена токенов палитры и мини-урок «цвета» прямо в интерфейсе |

> Все слова приведены в словарной форме без фраз. Перед публикацией в уроках **попросить преподавателя проверить**, особенно «юсь» (в Викисловаре есть и коми-зырянская статья) и «вож»: у этого слова в разных языках бывают и другие значения ⚠️.

### 5.5. Стиль: «белый холст + красная нить»

- **Основа:** тёплый белый «холст» (`#FBF7F0`) и много воздуха. Duolingo в 2026 году тоже разделяет элементы пространством, а не рамками (отчёт 01 ✅).
- **Акцент:** кирпично-красный «горд» в двух ролях: бренд (логотип, нить пути, орнамент) и праздник (серия, награды).
- **Геометрия:**
  - UI-формы — скруглённые: радиус 16px, кнопки с «ребром» (дружелюбно);
  - орнамент — **строгая сетка 45° и 90°** с модулем 4px, «стежком», как в счётной вышивке. Сама техника «счётной» вышивки у удмуртов источником ⚠️ не подтверждена, это наша стилизация.
  - Получается контраст «мягкий интерфейс + строгий узор».
- **Линии:** все «нитки» имеют `stroke-linecap: round`. Пунктир «стежок» задаётся `stroke-dasharray: 10 12`. Кривые пути и маскота — плавные S-образные Безье, как шея лебедя.
- **Иллюстрации:**
  - плоские, 2–3 цвета на картинку (горд, сьӧд, тӧдьы и один природный цвет), без градиентов-«пластика»;
  - вектор и минимум деталей — те же принципы, что в «языке форм» Duolingo (отчёт 01 ✅);
  - мотивы: дом и двор, лес и ель, река Чепца, город Глазов (для фраз «я из Глазова»), еда (перепечи, пельнянь), семья.
- **Генеративный орнамент:** полосы и разделители собираем из 3–4 мотивов в SVG `<pattern>`: толэзе, ромб, зигзаг, «ёлочка». Конкретный набор мотивов, кроме толэзе, источником ⚠️ не подтверждён; это стилизация, а не реконструкция.
  - Фото музейных предметов мы **не копируем** (авторские права на фото).
  - Когда пройдены все уроки юнита, на «полотне» профиля появляется вышитая полоса. За семестр получается «рушник» пользователя — сильный и культурно укоренённый «коллекционный» мотив.
- **Тёмная тема — «ночь»:** тёплый чёрный, а толэзе серебристо-светлый, как серебряная вышивка на чёрном (Шутова ✅).

**Чего не делать (без стереотипов):**
- не рисовать «этнокарикатуры» в костюмах, не делать айшон или «бабушек» персонажами;
- не изображать реальных людей, например популярный коллектив из Буранова;
- не превращать божеств и духов традиционной религии в мультяшек (Инмар, Кылдысин, *вумурт* и др.). Традиционная религия у удмуртов живая, наряду с православием ([ru.wikipedia](https://ru.wikipedia.org/wiki/Удмурты) ✅);
- не использовать устаревший экзоним «вотяки» ([там же](https://ru.wikipedia.org/wiki/Удмурты) ✅) нигде, кроме исторической справки;
- не делать флаг или герб игровыми объектами (§5.1).

### 5.6. Палитра (светлая и тёмная) и проверка контраста

Контраст мы посчитали по формуле WCAG 2.x своим скриптом ✅.

**Светлая тема**

| Токен (удм.) | Роль | Hex | Контраст |
|---|---|---|---|
| `--bg` *тӧдьы* «холст» | Фон страницы | `#FBF7F0` | — |
| `--surface` | Карточки, плитки | `#FFFFFF` | — |
| `--ink` *сьӧд* | Основной текст, нейтральная кнопка | `#1F1A17` | 16,1:1 на bg; 17,2:1 на белом |
| `--muted` | Второстепенный текст | `#5E5650` | 6,7:1 на bg |
| `--line` | Границы, трек прогресса | `#E6DED3` | декоративный; заливка прогресса на треке 4,9:1 ✅ ≥ 3:1 |
| `--red` *горд* | Бренд, нить, ошибка-контур | `#B3261E` | 6,1:1 на bg; белый текст на нём 6,5:1 |
| `--red-edge` | «Ребро» красной кнопки | `#7F1A15` | 9,5:1 к bg |
| `--red-soft` | Фон плашки «неверно» | `#FBE5E1` | ink на нём 14,3:1; red на нём 5,4:1 |
| `--green` *вож* / «кыз» | Верно, главное действие | `#2A744A` | 5,3:1 на bg; белый на нём 5,7:1 |
| `--green-edge` | «Ребро» зелёной кнопки | `#1C5233` | — |
| `--green-soft` | Фон плашки «верно» | `#E3F2E8` | green на нём 4,9:1; ink 14,9:1 |
| `--amber` *шунды* | Серия, XP, «почти» | `#9A5B00` | 5,1:1 на bg |
| `--amber-soft` | Фон бейджа серии | `#FCEFD9` | amber на нём 4,8:1 |
| `--focus` *лыз* | Фокус-кольцо, ссылки | `#24609B` | 6,1:1 на bg (≥3:1 для 2.4.13) |
| `--flag-red` | Только декор: конфетти, знак | `#DD2211` | 4,9:1 на белом (для текста не используем) |

**Тёмная тема — «ночь»**

| Токен | Hex | Контраст |
|---|---|---|
| `--bg` | `#141110` | — |
| `--surface` | `#1F1B19` | — |
| `--ink` | `#F4EFE7` | 16,4:1 на bg; 14,9:1 на surface |
| `--muted` | `#B9B0A6` | 8,8:1 на bg |
| `--line` | `#3A332F` | заливка red на треке 4,9:1 |
| `--red` | `#FF7A6B` | 7,4:1 на bg; тёмный текст на нём 7,4:1 |
| `--red-soft` | `#3A1A17` | ink на нём 13,7:1; red 6,2:1 |
| `--green` | `#6FD39A` | 10,3:1 на bg |
| `--green-soft` | `#16301F` | green на нём 7,8:1 |
| `--amber` | `#F5B657` | 9,5:1 на surface |
| `--focus` | `#8EC1F0` | 9,9:1 на bg |

**Семантика (важное решение):**
- Красный — цвет бренда и культуры. Если сделать его ещё и цветом **главной кнопки**, «ошибка» и «действие» визуально сольются.
- Поэтому главная кнопка «Проверить» нейтрально-чёрная (`--ink`).
- После ответа кнопка и плашка окрашиваются: **зелёный (ель)** — верно, **красный** — неверно, с иконкой ✗ и правильным ответом.
- Серия и XP — «солнечный» янтарь и градиент янтарь → красный.
- **Альтернатива** для А/Б-проверки на группе: сделать «неверно» янтарным («Почти!»), чтобы снизить ощущение наказания. Тогда красный останется только за брендом и праздником.

### 5.7. Маскот: лебедёнок «Юсь» (и «Пельнянь»)

**Культурная привязка:**
- *юсь* — «лебедь» ([ru.wiktionary](https://ru.wiktionary.org/wiki/юсь) ✅);
- белый лебедь на гербе — «символ возрождения, мудрости, мужества и совершенства» ([ru.wikipedia](https://ru.wikipedia.org/wiki/Герб_Удмуртской_Республики) ✅);
- белый цвет перекликается с северным костюмом (§5.3).

**Внешний вид:**
- круглое белое тело, длинная S-образная шея (плавная линия — та же кривая, что у пути);
- клюв-ромб, тёмные глаза с «бликом»;
- на шее — красная «вышитая» полоска, как ворот *дэрема* (стилизация ⚠️);
- **на грудь знак не ставим**, чтобы не копировать герб.

**4 состояния на SVG и CSS:**

| Состояние | Движение | Длительность |
|---|---|---|
| idle | Моргает раз в 4–6 с случайно, шея слегка покачивается | 3 с, loop; при reduced motion выкл. |
| happy | Два взмаха крыльями и прыжок на 8px | 400 мс, `--spring-pop` |
| sad | Шея опускается на −10°, без слёз и драмы | 300 мс, `--ease-standard` |
| celebrate | Разворот, затем летят конфетти-толэзе | 800 мс |

- **Позже — Rive:** стейт-машина с входами `isCorrect`, `isWrong`, `streak` (как делает Duolingo, отчёт 01 ✅).
- **«Пельнянь»** — второй, «смешной» персонаж для заданий на аудирование: пельмень с большими ушами. Шутка лингвистически точна: *пель* — «ухо» (§5.4). Пример реплики: «Пельнянь слушает…». Персонаж сразу показывает, что русское слово «пельмени» пришло из пермских языков, — готовый «вау-факт» для раздела «О языке».
- **Тон маскота** — поддерживающий, без пассивной агрессии. Сообщения формулируем в духе growth mindset: «Почти! Попробуем ещё».

---

## 6. Шрифты: проверка удмуртских букв

### 6.1. Метод

1. Для каждого семейства мы запросили `https://fonts.googleapis.com/css2?family=<имя>` с «старым» User-Agent. В ответ приходит **полный** TTF без сабсетов. Его таблицу cmap мы проверили через `fontTools` 4.67.0 на 10 кодовых точек: U+04DC–04DF, U+04E4–04E7, U+04F4–04F5.
2. Тот же запрос с современным User-Agent вернул woff2 **по сабсетам** с `unicode-range`. Мы скачали отдельно файлы `cyrillic` и `cyrillic-ext` и проверили их.
3. У 20 ключевых семейств проверили **все начертания**, включая курсив и вариативные диапазоны.
4. Глифы отрисовали на образце и посмотрели глазами: все буквы на месте, диакритика не «плавает».
5. Метаданные (лицензия, дизайнер, оси) взяли из `METADATA.pb` репозитория [google/fonts](https://github.com/google/fonts) ✅.

```python
# суть проверки (python3 -I, fontTools)
from fontTools.ttLib import TTFont
UDM = [0x04DC,0x04DD,0x04DE,0x04DF,0x04E4,0x04E5,0x04E6,0x04E7,0x04F4,0x04F5]
cmap = TTFont(path).getBestCmap()
missing = [hex(c) for c in UDM if c not in cmap]
```

### 6.2. Главные выводы

1. **Удмуртские буквы есть только в сабсете `cyrillic-ext`** (`unicode-range: U+0460-052F, …`). Сабсет `cyrillic` (`U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116`) их **не содержит** ни в одном шрифте (0 из 10 у всех) ✅.
2. **То, что шрифт заявляет сабсет `cyrillic-ext`, ничего не гарантирует.** Manrope, Unbounded, Wix Madefor Text и Display, Literata, Spectral, Sofia Sans, Plus Jakarta Sans, Jura, JetBrains Mono и Murecho отдают файл `cyrillic-ext`, но **удмуртских букв в нём нет**. Файл Manrope весит 2,5 КБ, Unbounded — 1,8 КБ ✅.
3. **Частичное покрытие опаснее отсутствия.** Браузер возьмёт недостающие буквы из запасного шрифта, и слово рассыплется на два шрифта:
   - **Roboto Flex**: есть Ӝӝ и Ӧӧ, **нет** Ӟӟ, Ӥӥ, Ӵӵ;
   - **Source Sans 3**: есть только Ӧӧ ✅.
4. **Параметр `&text=` не спасает, если глифов нет.** Для Manrope `text=ӜӝӞӟӤӥӦӧӴӵ` вернул файл только с базовыми Ж З И О Ч, хотя в CSS указан `unicode-range` с удмуртскими кодами ✅. У Nunito тот же запрос вернул 2,2 КБ со всеми десятью буквами, плюс базовые буквы и U+0308.
5. **Начертания:** у всех рекомендуемых семейств буквы есть во всех вариантах, включая курсив и весь вариативный диапазон: Nunito 200–1000 (прямой и курсив), Rubik 300–900 (прямой и курсив), Onest, Golos Text, Comfortaa, Geologica, Mulish (с курсивом), M PLUS Rounded 1c (7 статичных весов), Balsamiq Sans, Andika, Inter, Montserrat, Shantell Sans, Exo 2, Fira Sans, Noto Sans, PT Sans ✅.
6. **PT Sans** создан в проекте «Общедоступные шрифты народов России» и, по описанию, включает «символы всех титульных языков Российской Федерации» ([описание на Google Fonts](https://github.com/google/fonts/blob/main/ofl/ptsans/DESCRIPTION.en_us.html) ✅). Это надёжный запасной шрифт.

### 6.3. Таблица «шрифт — все 10 глифов — subset — характер»

Проверено 105 семейств Google Fonts, 21.10.2026. «Subset» — сабсет, в котором фактически лежат буквы. Характер — наша краткая оценка (субъективно) и категория Google Fonts.

**Округлые и дружелюбные (кандидаты для нас)**

| Шрифт | 10/10 | Subset | Оси, лицензия | Характер |
|---|---|---|---|---|
| **Nunito** | ✅ | cyrillic-ext | wght 200–1000, курсив; OFL | «Rounded terminal sans» по описанию GF: мягкий, открытый, ближе всех к духу Duolingo. **Текст** |
| **Rubik** | ✅ | cyrillic-ext | wght 300–900, курсив; OFL; есть `tnum` | «Slightly rounded corners», плотный и уверенный; кириллица Алексея Ваняшина (2016). **Заголовки и числа** |
| M PLUS Rounded 1c | ✅ | cyrillic-ext | 7 статичных весов; OFL | Полностью скруглённый, «японская» мягкость; без курсива |
| Comfortaa | ✅ | cyrillic-ext | wght 300–700; OFL; DISPLAY | Геометрический, очень круглый. Специфичные «д» и «л» снижают читаемость в тексте → только логотип и заголовки |
| Balsamiq Sans | ✅ | cyrillic-ext | 400/700 + курсив; OFL; DISPLAY | «Рукописный скетч», весёлый. Для реплик маскота, не для текста |
| Shantell Sans | ✅ | cyrillic-ext | wght 300–800, курсив, оси BNCE/INFM; OFL | «Маркер», игривый, есть ось «подпрыгивания» букв. Для реплик маскота |
| Mulish | ✅ | cyrillic-ext | wght 200–1000, курсив; OFL | Минималистичный, слегка округлый, лёгкий |
| Andika | ✅ | cyrillic-ext | 400/700 + курсив; OFL (SIL) | Создан для начинающих читать: однозначные формы букв. Хорош для упражнений на буквы ⚠️ (характеристику берём со слов SIL, не проверяли) |
| Pangolin, Marmelad, Kurale, Caveat, Bad Script | ✅ | cyrillic-ext | OFL | Рукописные и декоративные: акценты, стикеры |

**Нейтральные и «русские» гротески для текста и интерфейса**

| Шрифт | 10/10 | Subset | Оси, лицензия | Характер |
|---|---|---|---|---|
| Golos Text | ✅ | cyrillic-ext | wght 400–900; OFL | Paratype (Королькова, Кузьмин), 2019, создан для госсервисов, «для чтения с экрана». Отличен для длинных текстов |
| Onest | ✅ | cyrillic-ext | wght 100–900; OFL; `tnum` | Современный гротеск, тёплый, дружелюбнее Inter |
| Geologica | ✅ | cyrillic-ext | wght 100–900, оси SHRP, CRSV, slnt; OFL | Технологичный, с осью «острота» |
| Inter / Inter Tight | ✅ | cyrillic-ext | wght 100–900, opsz; OFL | Нейтральный UI-гротеск |
| Noto Sans / Serif | ✅ | cyrillic-ext | wght 100–900, wdth; OFL | Максимальное покрытие, нейтральный. Тяжёлый сабсет: cyrillic-ext 121 КБ (вариативный) |
| PT Sans / Caption / Serif / Mono | ✅ | cyrillic-ext | статичные; OFL | Все титульные языки РФ, классика. **Фолбэк** |
| Montserrat / Alternates, Raleway, Fira Sans, Exo 2, Roboto, Roboto Mono, Roboto Slab, Open Sans, Ubuntu, Ubuntu Sans, IBM Plex Sans, Commissioner, Nunito Sans, Didact Gothic, Arsenal, Alegreya (Sans), Cormorant, Oswald, Ysabeau, Gentium Plus, Philosopher, Yeseva One, Cuprum, Play, Fira Code, Bitter, Vollkorn, EB Garamond, Podkova, Tektur, Advent Pro, Overpass, Lora, Merriweather, Oi, Rubik Bubbles, Pacifico, Lobster | ✅ | cyrillic-ext | разные; OFL (Ubuntu — UFL) | Все проходят проверку. Выбор по вкусу |

**Не подходят**

| Шрифт | Результат | Почему опасно |
|---|---|---|
| **Roboto Flex** | ⚠️ 4/10: нет Ӟӟ, Ӥӥ, Ӵӵ | Частичное покрытие → смесь шрифтов внутри слова |
| **Source Sans 3** | ⚠️ 2/10: есть только Ӧӧ | То же |
| **Manrope, Unbounded**, Wix Madefor Text/Display, Literata, Spectral, Sofia Sans, Plus Jakarta Sans, Jura, JetBrains Mono, Murecho | ❌ 0/10, хотя сабсет `cyrillic-ext` заявлен | Вводит в заблуждение |
| Jost, Playfair Display, Tenor Sans, Prosto One, Russo One, Days One, Neucha, Dela Gothic One, Rubik Mono One, Ruslan Display, Stalinist One, Kelly Slab, Amatic SC, Marck Script, Comforter | ❌ 0/10: есть только `cyrillic` | Русский есть, удмуртского нет |
| Fredoka, Quicksand, Varela Round, Baloo 2, Lexend, Outfit, DM Sans, Work Sans, Comic Neue, Mitr, Readex Pro, Manjari, Raleway Dots | ❌: нет кириллицы вовсе | Многие популярные «округлые» шрифты отпадают |
| PT Root UI, Golos UI | не на Google Fonts | Не проверяли ⚠️ |

### 6.4. Рекомендация: пара шрифтов

| Роль | Шрифт | Начертания | Почему |
|---|---|---|---|
| Заголовки, кнопки, счётчики XP и таймеры | **Rubik** | 600–800 | Скруглённые углы, плотный жирный, есть `tnum` (цифры не «прыгают» при подсчёте), есть курсив |
| Текст, упражнения, удмуртские фразы | **Nunito** | 400–700 (+ курсив) | Скруглённые окончания, хорошая читаемость, широкий диапазон 200–1000 |
| Реплики маскота (по желанию) | Balsamiq Sans или Shantell Sans | 400/700 | «Голос» персонажа |
| Длинные тексты «История языка» (по желанию) | Golos Text | 400–600 | Если Nunito в длинном тексте покажется «детским» |
| Фолбэк | `"PT Sans", "Noto Sans", system-ui, sans-serif` | — | В PT Sans гарантированно есть все буквы. Какие системные шрифты Windows, Android и iOS содержат удмуртские буквы, ⚠️ не проверяли |

- **Бюджетный вариант** — одна Nunito на всё, вариативная 200–1000.
- Минус Nunito в том, что в отдаваемом файле нет `tnum` (мы видели только `calt, ccmp, dnom, frac, liga, locl, numr`). Для счётчиков в этом случае лучше задать фиксированную ширину контейнера.

### 6.5. Подключение

**Вариант A: Google Fonts CSS2 API (быстро).** Параметр `&subset=` в CSS2 не нужен: API сам отдаёт все сабсеты с `unicode-range`, и браузер скачает `cyrillic-ext` только тогда, когда на странице встретятся символы из U+0460–052F.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400..800;1,400..700&family=Rubik:wght@500..800&display=swap">
```

> **Подводный камень.** При `display=swap` буквы Ӝ, Ӟ, Ӥ, Ӧ, Ӵ приходят **вторым** файлом. Первые сотни миллисекунд они показываются системным шрифтом, остальные буквы — уже Nunito: внутри слова мелькает другой шрифт.
> Есть два решения: сделать `preload` файла `cyrillic-ext` или (лучше) собрать собственный единый сабсет, как в варианте B.

**Вариант B: свой сабсет на GitHub Pages (рекомендуем).** Один woff2-файл на семейство, без разбиения по `unicode-range`, сразу со всеми буквами:

```bash
# исходники: github.com/google/fonts → ofl/nunito/Nunito[wght].ttf, ofl/rubik/Rubik[wght].ttf (OFL)
pip install fonttools brotli
python3 -m fontTools.subset "Nunito[wght].ttf" \
  --unicodes="U+0020-007E,U+00A0,U+00AB,U+00BB,U+00B7,U+00D7,U+0301,U+0308,U+0400-045F,U+04DC-04DF,U+04E4-04E7,U+04F4-04F5,U+2010-2014,U+2018-201E,U+2022,U+2026,U+2116,U+2212,U+20BD" \
  --layout-features='kern,mark,mkmk,ccmp,locl,liga,calt,tnum,pnum,case' \
  --flavor=woff2 --output-file=Nunito-VF.udm.woff2
```

**Результат нашей сборки** ✅: `Nunito-VF.udm.woff2` весит **36 520 байт**, `Rubik-VF.udm.woff2` — **35 092 байта**. Обе вариативные, со всеми 10 удмуртскими буквами, около 220 кодовых точек. Для сравнения, сабсеты Google (latin + cyrillic + cyrillic-ext) весят у Nunito 39,1 + 20,8 + 28,9 ≈ **89 КБ**, у Rubik ≈ **63 КБ** (Fontsource 5.3.0).

```css
@font-face { font-family: "Nunito"; src: url("fonts/Nunito-VF.udm.woff2") format("woff2"); font-weight: 200 1000; font-style: normal; font-display: swap; }
@font-face { font-family: "Rubik";  src: url("fonts/Rubik-VF.udm.woff2")  format("woff2"); font-weight: 300 900;  font-style: normal; font-display: swap; }
```

```html
<link rel="preload" href="fonts/Nunito-VF.udm.woff2" as="font" type="font/woff2" crossorigin>
```

- Пути пишем **относительными**: сайт живёт в подкаталоге `/udmurt/`.
- Готовые пакеты Fontsource `@fontsource-variable/nunito` и `@fontsource-variable/rubik` 5.3.0 (OFL-1.1) содержат те же сабсеты, что и Google ✅. Ими удобно пользоваться, если сборка идёт через Vite.
- Не забыть положить рядом файл лицензии OFL.

**`&text=`** — только для логотипа или вордмарка, например `…css2?family=Comfortaa:wght@700&text=Удмурт%20кыл`. Google вернёт крошечный файл только с этими буквами и сам добавит базовые буквы и U+0308.

### 6.6. Ввод удмуртских букв (UX-вывод из проверки)

- **Над полем ввода — ряд кнопок-чипов** «ӝ ӟ ӥ ӧ ӵ» (с Shift — заглавные). Без них ни на телефоне, ни на ПК с обычной раскладкой эти буквы не набрать.
- **Нормализация ответа:**
  - `answer.normalize('NFC')`: если пользователь наберёт «з» плюс комбинируемое U+0308, получится Ӟ (U+04DE). Все рекомендуемые шрифты содержат U+0308 и умеют позиционировать знаки (`mark`/`mkmk`), так что разложенная форма тоже отрисуется прилично ✅;
  - мягко принимать латинские «двойники»: `ö` (U+00F6) → `ӧ` (U+04E7), `ä/ë/ï` — по правилам курса (решить с преподавателем ⚠️). Пользователю при этом показывать подсказку «правильно: ӧ».

---

## 7. Выводы для нашего сайта

### Must (MVP)

1. **Шрифты:** Rubik (заголовки, числа, кнопки) и Nunito (текст), собственные сабсеты woff2 по ~36 КБ (§6.5), фолбэк PT Sans.
   - **Запретить** Manrope, Unbounded, Roboto Flex, Source Sans 3 и всё из списка «Не подходят» (§6.3).
   - Добавить в CI или в тест страницу-образец со строкой «Ӝӝ Ӟӟ Ӥӥ Ӧӧ Ӵӵ» и проверкой через `document.fonts.check('16px Nunito', 'ӜӝӞӟӤӥӦӧӴӵ')`.
2. **Моушн-токены из §2** (длительности 100–450 мс, кривые M3, пружины `linear()` с фолбэком). Всё движение — внутри `prefers-reduced-motion: no-preference`, плюс свой переключатель «Меньше анимации».
3. **Обратная связь на ответ** по хореографии §2.4:
   - реакция быстрее 100 мс;
   - плашка снизу (`--spring-soft`), «поп» верного ответа, мягкая тряска при ошибке;
   - правильный ответ при ошибке и кнопка «Продолжить» по Enter.
4. **«Объёмные» кнопки и плитки** (§3.2). Нейтральная кнопка «Проверить» — чёрная `--ink`, после ответа окрашивается в зелёный или красный.
5. **Прогресс-бар урока** с пружиной и бликом, индикатор серии от 3 ответов подряд (§3.4).
6. **Финальный экран:** canvas-confetti с фигурами толэзе в цветах флага, `disableForReducedMotion: true`, счётчики XP и точности, «лесенка» карточек (§3.5).
7. **Звуки через WebAudio без файлов** (§3.8): «дзынь», «бум», комбо, фанфара; переключатель «Звуки»; контекст создаётся по первому клику.
8. **Доступность:**
   - `role="status"` и `announce()`;
   - фокус на «Продолжить»;
   - `:focus-visible` 3px;
   - иконки ✓/✗ рядом с цветом;
   - `lang="udm"` на удмуртских фразах;
   - палитра из §5.6 (весь текст ≥ 4,5:1, UI ≥ 3:1).
9. **Палитра «холст + сьӧд + горд + вож»** (§5.6), светлая и тёмная тема.
10. **Ряд кнопок с удмуртскими буквами над полями ввода** и NFC-нормализация ответов (§6.6).

### Should (следующая итерация)

1. **Путь уроков из плавной SVG-«нитки»** (Catmull-Rom, §3.6): прорисовка разблокированного отрезка, «поп» узла, пульсирующее кольцо текущего урока.
2. **Переходы между экранами** через View Transitions (§3.7): `startViewTransition` с `types` для SPA или `@view-transition` для MPA; узел пути «раскрывается» в шапку урока.
3. **Маскот «Юсь»** на SVG и CSS с 4 состояниями (§5.7). Реплики пишем в духе growth mindset.
4. **Вибрация** через `navigator.vibrate` для Android (§3.9) с отдельным переключателем.
5. **auto-animate** для «банка слов» и очереди ошибок.
6. **Генеративный орнамент** для разделителей и «вышивка» полосы за пройденный юнит (§5.5).
7. **Попросить преподавателя** проверить удмуртские подписи (*юсь*, *толэзе*, *шунды*, названия цветов), прежде чем они попадут в интерфейс.

### Could (когда будет время и люди)

1. Маскот на **Rive** со стейт-машиной (≥ 0,35 МБ brotli в lite-версии) или на Lottie.
2. **«Рушник» профиля**: коллекция вышитых полос за семестр, которой можно поделиться картинкой.
3. Второй персонаж **«Пельнянь»** для заданий на аудирование и «вау-факт» про слово «пельмени» в разделе «О языке».
4. Прорисовка пути при прокрутке через `animation-timeline: view()` как прогрессивное улучшение.
5. Хаптика на iOS через `<input switch>` (`ios-haptics`) — только как эксперимент ⚠️.
6. **Motion mini** (3,2 КБ), если понадобятся жесты и пружины с инерцией, например перетаскивание слов.
7. **А/Б-тест на группе:** «неверно» красным или янтарным «Почти!».

---

## 8. Источники

**Анимация, UX, доступность**
1. Laubheimer P. *Executing UX Animations: Duration and Motion Characteristics*. NN/g, 09.02.2020. https://www.nngroup.com/articles/animation-duration/
2. Nielsen J. *Response Times: The 3 Important Limits* (1993/2014). https://www.nngroup.com/articles/response-times-3-important-limits/
3. Tankala S. *Skeleton Screens 101*. NN/g, 2023. https://www.nngroup.com/articles/skeleton-screens/
4. Jonasson M., Purho P. *Juice it or lose it* (доклад, 2012). https://www.youtube.com/watch?v=Fy0aCDmgnxg
5. Nijman J. W. *The art of screenshake*, INDIGO Classes 2013. https://www.youtube.com/watch?v=AJdEqssNZ-U
6. Hartfelder K. *Streak milestone design & animation*. Duolingo Blog, 21.01.2022. https://blog.duolingo.com/streak-milestone-design-animation/
7. 60fps. *Fun in Every Frame* (Duolingo), 29.12.2024. https://60fpsdesign.substack.com/p/fun-in-every-frame
8. Crosley B. *Duolingo design guide* (реконструкция CSS). https://blakecrosley.com/guides/design/duolingo
9. Comeau J. W. *Building a Magical 3D Button*. https://www.joshwcomeau.com/animation/3d-button/
10. Comeau J. W. *Springs and Bounces in Native CSS* (`linear()`). https://www.joshwcomeau.com/animation/linear-timing-function/
11. Archibald J., Argyle A. *Linear() Easing Generator*. https://linear-easing-generator.netlify.app/
12. Material Design 3 — motion tokens, пакет `@material/web` 2.5.0 (Apache-2.0). https://cdn.jsdelivr.net/npm/@material/web@2.5.0/tokens/versions/latest/sass/_md-sys-motion.scss
13. MDN: `linear()`. https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear
14. MDN: View Transition API. https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
15. Chrome for Developers: Cross-document view transitions. https://developer.chrome.com/docs/web-platform/view-transitions/cross-document
16. MDN: Vibration API. https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
17. Chrome for Developers: Autoplay policy (Web Audio). https://developer.chrome.com/blog/autoplay
18. WebKit Blog: *An HTML Switch Control*, 28.02.2024. https://webkit.org/blog/15054/an-html-switch-control/
19. MDN: `aria-live`. https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live
20. W3C WCAG 2.2 Understanding: 2.3.3 Animation from Interactions. https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
21. W3C WCAG 2.2 Understanding: 2.4.13 Focus Appearance. https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
22. W3C WCAG 2.2 Understanding: 1.4.3 Contrast (Minimum); 1.4.11 Non-text Contrast; 1.4.1 Use of Color; 4.1.3 Status Messages. https://www.w3.org/WAI/WCAG22/Understanding/
23. MDN browser-compat-data 8.1.6 (15.10.2026), `data.json`. https://cdn.jsdelivr.net/npm/@mdn/browser-compat-data@latest/data.json

**Библиотеки** (npm registry и jsDelivr, 21.10.2026; размеры — наши замеры)

24. Motion 14.5.0 (MIT). https://motion.dev/docs/animate
25. GSAP 3.15.0 (Standard no-charge license). https://gsap.com/standard-license
26. anime.js 4.5.0 (MIT). https://animejs.com/documentation/svg
27. @formkit/auto-animate 0.10.0 (MIT). https://auto-animate.formkit.com/
28. canvas-confetti 1.9.4 (ISC). https://github.com/catdad/canvas-confetti
29. js-confetti 0.13.1 (MIT). https://www.npmjs.com/package/js-confetti
30. lottie-web 5.13.0 (MIT), @lottiefiles/dotlottie-web 0.81.0 (MIT). https://www.npmjs.com/package/lottie-web
31. @rive-app/canvas и canvas-lite 2.45.0 (MIT). https://www.npmjs.com/package/@rive-app/canvas
32. Svelte 5.57.2 (MIT): svelte/motion, svelte/transition. https://svelte.dev/docs/svelte/svelte-motion · https://svelte.dev/docs/svelte/svelte-transition
33. ZzFX 1.4.0 (MIT). https://www.npmjs.com/package/zzfx
34. ios-haptics 3.2.0 (MIT). https://github.com/tijnjh/ios-haptics

**Шрифты**

35. Google Fonts CSS2 API (проверка 105 семейств). https://fonts.googleapis.com/css2
36. Репозиторий google/fonts: METADATA.pb, DESCRIPTION (Nunito, Rubik, PT Sans, Golos Text и др.). https://github.com/google/fonts
37. Fontsource 5.3.0: @fontsource-variable/nunito, rubik, golos-text, onest (OFL-1.1). https://fontsource.org/
38. fontTools 4.67.0. https://github.com/fonttools/fonttools

**Удмуртская культура и символика**

39. Флаг Удмуртии. ru.wikipedia. https://ru.wikipedia.org/wiki/Флаг_Удмуртии
40. Герб Удмуртской Республики. ru.wikipedia. https://ru.wikipedia.org/wiki/Герб_Удмуртской_Республики
41. Flag of Udmurtia.svg (Wikimedia Commons). https://commons.wikimedia.org/wiki/File:Flag_of_Udmurtia.svg
42. Шутова Н. И. История происхождения и семантика лунного знака толезе // Вестник Удмуртского университета. История и филология. 2015. Т. 25, вып. 4. С. 87–94. https://journals.udsu.ru/history-philology/article/download/3596/3533
43. Октаграмма (толэзё). ru.wikipedia. https://ru.wikipedia.org/wiki/Октаграмма
44. Удмурты (костюм, орнамент, религия, этноним). ru.wikipedia. https://ru.wikipedia.org/wiki/Удмурты
45. Глазов. ru.wikipedia. https://ru.wikipedia.org/wiki/Глазов
46. Айшон. ru.wikipedia. https://ru.wikipedia.org/wiki/Айшон
47. Пельмени (этимология, Фасмер). ru.wikipedia. https://ru.wikipedia.org/wiki/Пельмени
48. ru.wiktionary, удмуртские статьи: шунды, толэзь, кизили, юсь, кыз, пельнянь, перепеч, тӧдьы, сьӧд, горд, вож, лыз. https://ru.wiktionary.org/

**Связанные отчёты проекта:** [01-duolingo-teardown.md](01-duolingo-teardown.md), [02-other-apps-and-minority-languages.md](02-other-apps-and-minority-languages.md).
