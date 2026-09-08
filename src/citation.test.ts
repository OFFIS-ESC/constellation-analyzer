import { describe, it, expect } from 'vitest';
import { citation, formatCitation, parseCitation, proposedCitation } from './citation';

/**
 * CITATION.cff is maintained by hand and read by Zenodo, GitHub and the About
 * dialog alike. These tests check that the real file still loads and that the
 * CRediT sentence still lines up with the author list — the one part of the
 * file that no CFF validator can check for us.
 */

describe('CITATION.cff', () => {
  it('loads the real file', () => {
    expect(citation.title).toBe('Constellation Analyzer');
    expect(citation.license).toBe('MIT');
    expect(citation.authors).toHaveLength(4);
  });

  it('gives every author an affiliation and an ORCID', () => {
    citation.authors.forEach((author) => {
      expect(author.affiliation).toBeTruthy();
      expect(author.orcid).toMatch(/^https:\/\/orcid\.org\//);
    });
  });

  it('matches every author to their CRediT roles', () => {
    // A name misspelled in the abstract silently drops that author's roles,
    // so assert the whole set rather than a sample.
    expect(
      Object.fromEntries(citation.authors.map((a) => [a.name, a.roles]))
    ).toEqual({
      'Jan-Henrik Bruhn': ['Conceptualization', 'Methodology', 'Software'],
      'Florian Helfrich': [
        'Conceptualization',
        'Methodology',
        'Investigation',
        'Visualization',
      ],
      'Nina Kerker': ['Conceptualization', 'Methodology', 'Investigation'],
      'Sven Rosinger': ['Conceptualization', 'Methodology'],
    });
  });

  it('exposes the Zenodo concept DOI as a resolvable link', () => {
    // Concept, not version: it must not carry a release number, or it would go
    // stale on every release.
    expect(citation.doi).toBe('10.5281/zenodo.20085913');
    expect(citation.doiUrl).toBe('https://doi.org/10.5281/zenodo.20085913');
  });

  it('keeps the CRediT sentence out of the description', () => {
    expect(citation.description).not.toContain('CRediT');
    expect(citation.description).toContain('constellation analyses');
  });
});

describe('the proposed citation', () => {
  it('reads as an APA-style software reference', () => {
    expect(formatCitation(citation)).toBe(
      `Bruhn, J.-H., Helfrich, F., Kerker, N., & Rosinger, S. (${citation.releaseDate?.slice(0, 4)}). ` +
        'Constellation Analyzer (Version 1.0.0) [Computer software]. Zenodo. ' +
        'https://doi.org/10.5281/zenodo.20085913'
    );
  });

  it('takes its year from date-released, not from today', () => {
    expect(citation.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(proposedCitation).toContain(`(${citation.releaseDate?.slice(0, 4)})`);
  });

  it('names a single author without an ampersand', () => {
    const one = parseCitation(`
cff-version: 1.2.0
title: Example
version: 2.0.0
date-released: 2026-01-31
authors:
  - given-names: Ada
    family-names: Lovelace
`);
    expect(formatCitation(one)).toBe(
      'Lovelace, A. (2026). Example (Version 2.0.0) [Computer software].'
    );
  });

  it('keeps a name particle with the family name', () => {
    const parsed = parseCitation(`
cff-version: 1.2.0
title: Example
authors:
  - given-names: Ludwig
    name-particle: van
    family-names: Beethoven
`);
    expect(parsed.authors[0].referenceName).toBe('van Beethoven, L.');
  });

  it('falls back to the repository when there is no DOI', () => {
    const parsed = parseCitation(`
cff-version: 1.2.0
title: Example
date-released: 2026-01-31
repository-code: 'https://example.org/repo'
authors:
  - given-names: Ada
    family-names: Lovelace
`);
    expect(formatCitation(parsed)).toContain('https://example.org/repo');
    expect(formatCitation(parsed)).not.toContain('Zenodo');
  });
});

describe('parseCitation', () => {
  it('reads authors without a CRediT statement', () => {
    const parsed = parseCitation(`
cff-version: 1.2.0
title: Example
abstract: Just a description.
authors:
  - given-names: Ada
    family-names: Lovelace
`);
    expect(parsed.authors).toEqual([
      {
        name: 'Ada Lovelace',
        affiliation: undefined,
        location: undefined,
        email: undefined,
        orcid: undefined,
        roles: [],
        referenceName: 'Lovelace, A.',
      },
    ]);
    expect(parsed.description).toBe('Just a description.');
  });

  it('handles a name that is a prefix of another name', () => {
    const parsed = parseCitation(`
cff-version: 1.2.0
title: Example
abstract: >-
  CRediT author statement: Ada Lovelace King: Software. Ada Lovelace:
  Methodology.
authors:
  - given-names: Ada
    family-names: Lovelace
  - given-names: Ada
    family-names: Lovelace King
`);
    expect(parsed.authors.map((a) => a.roles)).toEqual([
      ['Methodology'],
      ['Software'],
    ]);
  });

  it('spells out the country and joins it with the city', () => {
    const parsed = parseCitation(`
cff-version: 1.2.0
title: Example
authors:
  - given-names: Ada
    family-names: Lovelace
    city: Oldenburg
    country: DE
`);
    expect(parsed.authors[0].location).toBe('Oldenburg, Germany');
  });
});
