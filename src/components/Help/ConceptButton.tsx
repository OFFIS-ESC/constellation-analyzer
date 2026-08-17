import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ConceptDialog from './ConceptDialog';
import { concepts, type ConceptId } from '../../help/concepts';

/**
 * ConceptButton - the "?" affordance that opens a Tier 3 concept dialog
 *
 * Placement rules:
 * - Section headers in panels, and modal headers.
 * - Never on an individual form field. A field-level "?" means a concept
 *   dialog is missing, or the copy belongs in a FieldHint.
 * - Muted until hover, so it never competes with the section's real action.
 */

interface ConceptButtonProps {
  concept: ConceptId;
  /** Tooltip placement, matching the surrounding controls. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const ConceptButton = ({ concept, placement = 'top', className = '' }: ConceptButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const title = concepts[concept].title;

  return (
    <>
      <Tooltip title={`About ${title.toLowerCase()}`} placement={placement}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className={className}
          aria-label={`About ${title.toLowerCase()}`}
          sx={{
            padding: '2px',
            color: '#9ca3af',
            '&:hover': { color: '#2563eb' },
          }}
        >
          <HelpOutlineIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      <ConceptDialog conceptId={isOpen ? concept : null} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ConceptButton;
