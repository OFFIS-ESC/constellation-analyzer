import { useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { citation, proposedCitation } from '../../citation';

/**
 * AboutDialog - who made this and who paid for it
 *
 * The funding notice has to be visible in the app itself, not only in the
 * README, because most people meet this tool as a running app and never see
 * the repository.
 *
 * Authors come from CITATION.cff (see src/citation.ts) so that the app, Zenodo
 * and GitHub all cite the same people.
 *
 * Logos live in `public/`, so they are addressed through BASE_URL rather than
 * an absolute `/` path: the build uses a relative base, and an absolute path
 * would break as soon as the app is served from a subdirectory.
 */

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const assetUrl = (file: string) => `${import.meta.env.BASE_URL}${file}`;

const AboutDialog = ({ isOpen, onClose }: AboutDialogProps) => {
  const [copied, setCopied] = useState(false);

  // The confirmation sits on the button the user just pressed, so it is where
  // they are already looking.
  const handleCopyCitation = async () => {
    try {
      await navigator.clipboard.writeText(proposedCitation);
      setCopied(true);
    } catch {
      // Clipboard access can be refused (insecure context, denied permission).
      // The citation is selectable text right next to the button, so there is
      // nothing to recover from — just don't claim a copy that did not happen.
      setCopied(false);
    }
  };

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-dialog-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InfoOutlinedIcon sx={{ fontSize: 26 }} />
            <div>
              <h2 id="about-dialog-title" className="text-xl font-bold">
                About {citation.title}
              </h2>
              {citation.version && (
                <p className="text-xs text-blue-100">Version {citation.version}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6">
          {citation.description && (
            <p className="text-sm text-gray-700">{citation.description}</p>
          )}

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Authors
            </h3>
            <ul className="space-y-4">
              {citation.authors.map((author) => (
                <li key={author.orcid ?? author.name} className="text-sm">
                  <div className="font-semibold text-gray-900">{author.name}</div>
                  {author.affiliation && (
                    <div className="text-gray-700">{author.affiliation}</div>
                  )}
                  {author.location && (
                    <div className="text-gray-500">{author.location}</div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    {author.email && (
                      <a
                        href={`mailto:${author.email}`}
                        className="text-blue-700 hover:underline"
                      >
                        {author.email}
                      </a>
                    )}
                    {author.orcid && (
                      <a
                        href={author.orcid}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                      >
                        ORCID
                      </a>
                    )}
                  </div>
                  {author.roles.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {author.roles.join(' · ')}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500">
              Contributions follow the{' '}
              <a
                href="https://credit.niso.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:underline"
              >
                CRediT taxonomy
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Citing this software
              </h3>
              <button
                onClick={handleCopyCitation}
                className="text-xs font-medium text-blue-700 hover:bg-blue-50 rounded px-2 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-4 py-3 leading-relaxed select-all">
              {proposedCitation}
            </p>
            {citation.doiUrl && (
              <p className="text-xs text-gray-500">
                That DOI is the concept DOI — it always resolves to the most recent
                release.{' '}
                <a
                  href={citation.doiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  Open on Zenodo
                </a>
                {' '}to cite a specific version instead.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              License
            </h3>
            <p className="text-sm text-gray-700">
              {citation.license ?? 'MIT'}
              {citation.repositoryUrl && (
                <>
                  {' — '}
                  <a
                    href={citation.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    source code
                  </a>
                </>
              )}
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Funding
            </h3>
            <p className="text-sm text-gray-700">
              This publication was created as part of the research program
              “Transforming the Energy System Lower Saxony” (TEN.efzn) at the Energy
              Research Center of Lower Saxony (efzn).
            </p>
            <p className="text-sm text-gray-700">
              Funded by zukunft.niedersachsen, the joint science funding program of the
              Lower Saxony Ministry of Science and Culture and the Volkswagen
              Foundation.
            </p>
            <div className="flex flex-wrap items-center gap-8 pt-1">
              <img
                src={assetUrl('efzn.png')}
                alt="Energy Research Center of Lower Saxony (efzn)"
                className="h-16 w-auto"
              />
              <img
                src={assetUrl('zn.png')}
                alt="zukunft.niedersachsen"
                className="h-12 w-auto"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutDialog;
