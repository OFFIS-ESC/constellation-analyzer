import GraphMetrics from '../Common/GraphMetrics';
import type { Actor, Relation } from '../../types';

interface GraphAnalysisPanelProps {
  nodes: Actor[];
  edges: Relation[];
}

const GraphAnalysisPanel = ({ nodes, edges }: GraphAnalysisPanelProps) => {
  return <GraphMetrics nodes={nodes} edges={edges} />;
};

export default GraphAnalysisPanel;
