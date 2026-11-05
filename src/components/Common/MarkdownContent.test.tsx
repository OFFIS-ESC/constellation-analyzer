import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MarkdownContent from './MarkdownContent';

const renderSource = (source: string) => render(<MarkdownContent source={source} />).container;

describe('MarkdownContent', () => {
  it('renders the supported formatting', () => {
    const container = renderSource('## Titel\n\n**fett** und *kursiv*\n\n> Zitat\n> — Interview 3, Z. 42');
    expect(container.querySelector('h3')?.textContent).toBe('Titel');
    expect(container.querySelector('strong')?.textContent).toBe('fett');
    expect(container.querySelector('em')?.textContent).toBe('kursiv');
    expect(container.querySelector('blockquote br')).not.toBeNull();
  });

  it('keeps single line breaks from pasted text', () => {
    expect(renderSource('Zeile eins\nZeile zwei').querySelector('br')).not.toBeNull();
  });

  it('does not alter gender notation in a quote', () => {
    const container = renderSource('Mitarbeiter*innen und Kolleg*innen');
    expect(container.textContent).toBe('Mitarbeiter*innen und Kolleg*innen');
    expect(container.querySelector('em')).toBeNull();
  });

  it('shows raw HTML as literal text', () => {
    const container = renderSource('<lacht> ja <script>alert(1)</script>');
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<lacht>');
  });

  it('never loads remote images', () => {
    expect(renderSource('![x](http://example.com/x.png)').querySelector('img')).toBeNull();
  });

  it('strips script links and opens others safely', () => {
    expect(renderSource('[k](javascript:alert(1))').querySelector('a')?.getAttribute('href')).toBe('');
    const link = renderSource('[k](https://example.com)').querySelector('a');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
  });

  it('keeps the words of indented text without a code block', () => {
    const container = renderSource('    eingerückt');
    expect(container.querySelector('code')).toBeNull();
    expect(container.textContent).toContain('eingerückt');
  });
});
