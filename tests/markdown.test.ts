import { describe, expect, it } from 'vitest';
import { escapeHtml, renderMarkdown } from '../src/lib/markdown.ts';

describe('renderMarkdown', () => {
  it('заголовки ## и ### со сдвигом уровня', () => {
    expect(renderMarkdown('## Падежи')).toBe('<h2>Падежи</h2>');
    expect(renderMarkdown('### Мелочи')).toBe('<h3>Мелочи</h3>');
    expect(renderMarkdown('## Падежи', { headingShift: 1 })).toBe('<h3>Падежи</h3>');
    expect(renderMarkdown('# Х', { headingShift: 9 })).toBe('<h6>Х</h6>');
  });

  it('списки и абзацы, список прерывает абзац', () => {
    const html = renderMarkdown('Связки нет:\n- **Мон Алексей.** — «Я Алексей».\n- **Мон студент.**\n\nКонец\nабзаца');
    expect(html).toBe(
      '<p>Связки нет:</p>\n<ul><li><strong>Мон Алексей.</strong> — «Я Алексей».</li><li><strong>Мон студент.</strong></li></ul>\n<p>Конец абзаца</p>',
    );
  });

  it('нумерованный список', () => {
    expect(renderMarkdown('1. раз\n2. два')).toBe('<ol><li>раз</li><li>два</li></ol>');
  });

  it('жирный и курсив, в том числе рядом', () => {
    expect(renderMarkdown('**ним** «имя» и *курсив*')).toBe('<p><strong>ним</strong> «имя» и <em>курсив</em></p>');
    expect(renderMarkdown('***оба***')).toContain('<strong>');
    expect(renderMarkdown('2 * 3 * 4')).toBe('<p>2 * 3 * 4</p>');
  });

  it('lang и класс для жирного', () => {
    expect(renderMarkdown('**Тау!**', { strongLang: 'udm', strongClass: 'udm' })).toBe(
      '<p><strong lang="udm" class="udm">Тау!</strong></p>',
    );
  });

  it('экранирует HTML — никаких тегов и атрибутов из контента', () => {
    const html = renderMarkdown('## <img src=x onerror=alert(1)>\n- <script>alert(1)</script>\n**"x" & \'y\'**');
    expect(html).not.toMatch(/<img|<script/);
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&quot;x&quot; &amp; &#39;y&#39;');
    expect(escapeHtml('<a href="x">')).toBe('&lt;a href=&quot;x&quot;&gt;');
  });

  it('код не размечается внутри', () => {
    expect(renderMarkdown('`*x*` и *y*')).toBe('<p><code>*x*</code> и <em>y</em></p>');
  });

  it('продолжение пункта списка с отступом', () => {
    expect(renderMarkdown('- первая\n  строка\n- вторая')).toBe('<ul><li>первая строка</li><li>вторая</li></ul>');
  });

  it('шпаргалка юнита 1 рендерится без «сырых» звёздочек и решёток', () => {
    const guide = '## Здороваемся\n- **Ӟечбуресь!** — «Здравствуйте!»\n\n## Притяжательные\n**ним** «имя» → **ним-ы** «моё имя».\n- **Нош тынад?**';
    const html = renderMarkdown(guide);
    expect(html).not.toMatch(/\*|##/);
    expect(html.match(/<h2>/g)).toHaveLength(2);
  });
  it('таблицы: шапка, разделитель не выводится, жирный внутри ячеек', () => {
    const html = renderMarkdown('| вопрос | пример |\n|---|---|\n| **кытын?** | карын |');
    expect(html).toContain('<thead><tr><th>вопрос</th><th>пример</th></tr></thead>');
    expect(html).toContain('<td><strong>кытын?</strong></td><td>карын</td>');
    expect(html).not.toContain('---');
  });
  it('таблица без шапки', () => {
    const html = renderMarkdown('| | |\n|---|---|\n| понедельник | вордӥськон |');
    expect(html).not.toContain('<thead>');
    expect(html).toContain('<td>понедельник</td>');
  });
});
