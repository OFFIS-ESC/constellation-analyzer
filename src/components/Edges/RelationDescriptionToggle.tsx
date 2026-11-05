import { IconButton } from '@mui/material';
import NotesIcon from '@mui/icons-material/Notes';
import { useSetRelationDescriptionsVisible } from '../../hooks/useRelationDescriptionVisibility';

interface RelationDescriptionToggleProps {
  relationId: string;
  visible: boolean;
  color: string;
}

/**
 * The button on a relation's label that shows or hides its description. Being
 * there at all also tells the reader that this relation has one.
 */
const RelationDescriptionToggle = ({ relationId, visible, color }: RelationDescriptionToggleProps) => {
  const setVisible = useSetRelationDescriptionsVisible();
  const title = visible ? 'Hide description' : 'Show description';

  return (
    <IconButton
      size="small"
      title={title}
      aria-label={title}
      aria-pressed={visible}
      data-export-hidden
      className="nopan"
      onClick={(event) => {
        event.stopPropagation();
        setVisible([relationId], !visible);
      }}
      sx={{ padding: '1px', color: visible ? color : '#9ca3af' }}
    >
      <NotesIcon sx={{ fontSize: 14 }} />
    </IconButton>
  );
};

export default RelationDescriptionToggle;
