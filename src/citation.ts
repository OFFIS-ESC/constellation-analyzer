import { parse } from 'yaml';
import citationFile from '../CITATION.cff?raw';

/**
 * Authorship, read from CITATION.cff
 *
 * CITATION.cff is the single source of truth for who wrote this. It is the file
 * Zenodo and GitHub read, so keeping a second copy of the author list in the UI
 * would only give the two a chance to drift apart.
 *
 * CFF 1.2.0 has no field for CRediT roles and its schema rejects unknown keys,
 * so the CRediT statement lives in `abstract` as one sentence and is split back
 * out here. If that sentence is missing or worded differently, authors simply
 * come through without roles — nothing else breaks.
 */

export interface CitationAuthor {
  /** Full name, in the order a person would write it. */
  name: string;
  affiliation?: string;
  /** "City, Country" — only the parts the CFF actually gives. */
  location?: string;
  email?: string;
  orcid?: string;
  /** CRediT roles, in the order the statement lists them. */
  roles: string[];
  /** "Bruhn, J.-H." — the form a reference list wants. */
  referenceName: string;
}

export interface Citation {
  title: string;
  version?: string;
  license?: string;
  repositoryUrl?: string;
  /** Bare DOI, as CFF stores it (no resolver prefix). */
  doi?: string;
  /** Resolver URL for `doi`, ready to link. */
  doiUrl?: string;
  /** Release date as CFF stores it, YYYY-MM-DD. */
  releaseDate?: string;
  /** The abstract with the CRediT sentence removed. */
  description: string;
  authors: CitationAuthor[];
}

interface CffPerson {
  'given-names'?: string;
  'family-names'?: string;
  'name-particle'?: string;
  'name-suffix'?: string;
  affiliation?: string;
  city?: string;
  country?: string;
  email?: string;
  orcid?: string;
}

interface CffFile {
  title?: string;
  version?: string | number;
  license?: string;
  abstract?: string;
  doi?: string;
  'date-released'?: string;
  'repository-code'?: string;
  authors?: CffPerson[];
}

const CREDIT_MARKER = 'CRediT author statement:';

/** ISO 3166-1 alpha-2 codes the CFF uses, spelled out for readers. */
const COUNTRY_NAMES: Record<string, string> = {
  DE: 'Germany',
};

const personName = (person: CffPerson): string =>
  [
    person['given-names'],
    person['name-particle'],
    person['family-names'],
    person['name-suffix'],
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

/**
 * "Bruhn, J.-H." — family name first, given names as initials, hyphens kept.
 */
const referenceName = (person: CffPerson): string => {
  const family = [person['name-particle'], person['family-names']]
    .filter(Boolean)
    .join(' ');
  const given = (person['given-names'] ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) =>
      part
        .split('-')
        .filter(Boolean)
        .map((chunk) => `${chunk[0]}.`)
        .join('-')
    )
    .join(' ');
  return [family, given].filter(Boolean).join(', ');
};

const personLocation = (person: CffPerson): string | undefined => {
  const country = person.country
    ? COUNTRY_NAMES[person.country] ?? person.country
    : undefined;
  const parts = [person.city, country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
};

/**
 * Pull the per-author roles out of the CRediT sentence.
 *
 * The statement is a run of "Name: Role, Role, Role." clauses. Splitting on
 * "Name:" rather than on punctuation keeps role lists with commas intact.
 */
const parseCreditRoles = (abstract: string, names: string[]): Map<string, string[]> => {
  const roles = new Map<string, string[]>();
  const markerAt = abstract.indexOf(CREDIT_MARKER);
  if (markerAt === -1) return roles;

  const statement = abstract.slice(markerAt + CREDIT_MARKER.length);

  // Where each author's clause starts. Longest name first, so that a name that
  // is a prefix of another one cannot claim the wrong clause.
  const starts = [...names]
    .sort((a, b) => b.length - a.length)
    .map((name) => ({ name, at: statement.indexOf(`${name}:`) }))
    .filter((entry) => entry.at !== -1)
    .sort((a, b) => a.at - b.at);

  starts.forEach((entry, index) => {
    const from = entry.at + entry.name.length + 1;
    const to = index + 1 < starts.length ? starts[index + 1].at : statement.length;
    const list = statement
      .slice(from, to)
      .split(',')
      .map((role) => role.replace(/[.\s]+$/, '').trim())
      .filter(Boolean);
    roles.set(entry.name, list);
  });

  return roles;
};

/** Everything before the CRediT sentence, with the line wrapping smoothed out. */
const parseDescription = (abstract: string): string => {
  const markerAt = abstract.indexOf(CREDIT_MARKER);
  const text = markerAt === -1 ? abstract : abstract.slice(0, markerAt);
  return text.replace(/\s+/g, ' ').trim();
};

export const parseCitation = (source: string): Citation => {
  const cff = (parse(source) ?? {}) as CffFile;
  const abstract = cff.abstract ?? '';
  const people = cff.authors ?? [];
  const names = people.map(personName).filter(Boolean);
  const roles = parseCreditRoles(abstract, names);

  return {
    title: cff.title ?? 'Constellation Analyzer',
    version: cff.version !== undefined ? String(cff.version) : undefined,
    license: cff.license,
    repositoryUrl: cff['repository-code'],
    doi: cff.doi,
    doiUrl: cff.doi ? `https://doi.org/${cff.doi}` : undefined,
    releaseDate: cff['date-released'],
    description: parseDescription(abstract),
    authors: people.map((person) => {
      const name = personName(person);
      return {
        name,
        affiliation: person.affiliation?.replace(/\s+/g, ' ').trim(),
        location: personLocation(person),
        email: person.email,
        orcid: person.orcid,
        roles: roles.get(name) ?? [],
        referenceName: referenceName(person),
      };
    }),
  };
};

/** Zenodo is the only repository we mint DOIs with; anything else stays unnamed. */
const doiPublisher = (doi?: string): string | undefined =>
  doi?.startsWith('10.5281/zenodo.') ? 'Zenodo' : undefined;

/**
 * The year to cite: the year of the release, not of the moment someone reads
 * this. `date-released` is kept current by release-please, so it is right for
 * whatever version is deployed. The fallback only matters for a CFF that has
 * no date at all.
 */
const citationYear = (source: Citation): string =>
  source.releaseDate?.slice(0, 4) ?? String(new Date().getFullYear());

/**
 * A ready-to-paste citation, APA-style for software.
 *
 * Assembled here rather than pulled from a formatter: the whole point is that
 * it reflects CITATION.cff, and every part of it already lives in this module.
 */
export const formatCitation = (source: Citation): string => {
  const year = citationYear(source);
  const names = source.authors.map((author) => author.referenceName);
  const authors =
    names.length > 1
      ? `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`
      : names[0] ?? '';

  const parts = [
    authors && `${authors} (${year}).`,
    !authors && `${source.title} (${year}).`,
    authors && source.title,
    source.version && `(Version ${source.version})`,
    '[Computer software].',
    doiPublisher(source.doi) && `${doiPublisher(source.doi)}.`,
    source.doiUrl ?? source.repositoryUrl,
  ].filter(Boolean);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
};

export const citation: Citation = parseCitation(citationFile);

export const proposedCitation: string = formatCitation(citation);
