import { ControlButton } from '@xyflow/react';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { useGraphStore } from '../../stores/graphStore';
import { useRelationDescriptionViewStore } from '../../stores/relationDescriptionViewStore';
import { useSetRelationDescriptionsVisible, useResetDescriptionViewAfterPresenting } from '../../hooks/useRelationDescriptionVisibility';
import { getToggleAllDescriptionsAction } from '../../utils/relationDescription';

/**
 * Canvas control that hides every relation description box, or shows them all
 * once none is open. It lives on the canvas rather than in a menu so it is also
 * available in presentation mode. Hidden when no relation has a description.
 */
const ToggleAllDescriptionsButton = () => {
  const edges = useGraphStore((state) => state.edges);
  const visibilityOverrides = useRelationDescriptionViewStore((state) => state.visibilityOverrides);
  const setVisible = useSetRelationDescriptionsVisible();
  useResetDescriptionViewAfterPresenting();

  const { ids, show } = getToggleAllDescriptionsAction(edges, visibilityOverrides);
  if (ids.length === 0) return null;

  const title = show ? 'Show all descriptions' : 'Hide all descriptions';
  return (
    <ControlButton title={title} aria-label={title} onClick={() => setVisible(ids, show)}>
      {show ? <UnfoldMoreIcon /> : <UnfoldLessIcon />}
    </ControlButton>
  );
};

export default ToggleAllDescriptionsButton;
