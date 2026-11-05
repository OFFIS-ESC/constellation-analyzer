import { describe, it, expect } from 'vitest';
import { applyMarkdownFormat, prepareMarkdown } from './markdown';

describe('prepareMarkdown', () => {
  it('escapes stars inside words so gender notation survives', () => {
    expect(prepareMarkdown('Mitarbeiter*innen und Kolleg*innen')).toBe(
      'Mitarbeiter\\*innen und Kolleg\\*innen',
    );
  });

  it('handles umlauts and digits as word characters', () => {
    expect(prepareMarkdown('Bürger*innen, 3*4')).toBe('Bürger\\*innen, 3\\*4');
  });

  it('leaves real emphasis alone', () => {
    const source = '**fett** und *kursiv* und ***beides***';
    expect(prepareMarkdown(source)).toBe(source);
  });

  it('does not touch a star that is already escaped', () => {
    expect(prepareMarkdown('Kolleg\\*innen')).toBe('Kolleg\\*innen');
  });
});

describe('applyMarkdownFormat', () => {
  it('wraps the selection in bold and keeps it selected', () => {
    expect(applyMarkdownFormat('ein Wort hier', 4, 8, 'bold')).toEqual({
      text: 'ein **Wort** hier',
      selectionStart: 6,
      selectionEnd: 10,
    });
  });

  it('removes bold when applied again', () => {
    expect(applyMarkdownFormat('ein **Wort** hier', 6, 10, 'bold')).toEqual({
      text: 'ein Wort hier',
      selectionStart: 4,
      selectionEnd: 8,
    });
  });

  it('places the cursor inside the markers when nothing is selected', () => {
    expect(applyMarkdownFormat('', 0, 0, 'italic')).toEqual({
      text: '**',
      selectionStart: 1,
      selectionEnd: 1,
    });
  });

  it('does not mistake bold for italic', () => {
    expect(applyMarkdownFormat('**Wort**', 2, 6, 'italic').text).toBe('***Wort***');
  });

  it('removes italic from italic text', () => {
    expect(applyMarkdownFormat('*Wort*', 1, 5, 'italic').text).toBe('Wort');
  });

  it('prefixes the line holding the cursor with a heading', () => {
    const result = applyMarkdownFormat('eins\nzwei', 7, 7, 'heading');
    expect(result.text).toBe('eins\n## zwei');
    expect(result.selectionStart).toBe(10);
  });

  it('quotes every selected line and skips blank ones', () => {
    expect(applyMarkdownFormat('a\n\nb', 0, 4, 'quote').text).toBe('> a\n\n> b');
  });

  it('removes the quote when every line already has it', () => {
    expect(applyMarkdownFormat('> a\n> b', 0, 7, 'quote').text).toBe('a\nb');
  });

  it('does not touch the line after a trailing line break in the selection', () => {
    expect(applyMarkdownFormat('a\nb', 0, 2, 'quote').text).toBe('> a\nb');
  });

  it('prefixes an empty document', () => {
    expect(applyMarkdownFormat('', 0, 0, 'quote')).toEqual({
      text: '> ',
      selectionStart: 2,
      selectionEnd: 2,
    });
  });
});
