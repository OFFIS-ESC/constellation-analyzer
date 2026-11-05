import MarkdownContent from '../Common/MarkdownContent';

interface RelationDescriptionBoxProps {
  description: string;
  color: string;
}

/**
 * The description box on a relation. Hangs below the label card rather than
 * inside it, so the label stays on the line however long the text gets. It never
 * scrolls internally, since scrolled-away text would be missing from exports.
 */
const RelationDescriptionBox = ({ description, color }: RelationDescriptionBoxProps) => (
  <div
    data-graph-overlay
    className="nopan absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white rounded border border-gray-300 shadow-sm px-2 py-1.5 text-xs font-normal leading-snug text-gray-800 cursor-text"
    style={{ width: '280px', borderTop: `3px solid ${color}`, userSelect: 'text' }}
  >
    <MarkdownContent source={description} />
  </div>
);

export default RelationDescriptionBox;
