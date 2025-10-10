import { useMemo } from 'react';
import { Tooltip } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import BarChartIcon from '@mui/icons-material/BarChart';
import { calculateGraphMetrics } from '../../utils/graphAnalysis';
import type { Actor, Relation } from '../../types';

interface GraphMetricsProps {
  nodes: Actor[];
  edges: Relation[];
  onActorClick?: (actorId: string) => void;
}

/**
 * GraphMetrics - Display graph analysis and statistics
 *
 * Shows when no node or edge is selected in the right panel.
 * Provides insights into graph structure, connectivity, and key actors.
 */
const GraphMetrics = ({ nodes, edges, onActorClick }: GraphMetricsProps) => {
  // Calculate all metrics (memoized for performance - auto-updates when nodes/edges change)
  const metrics = useMemo(() => {
    return calculateGraphMetrics(nodes, edges);
  }, [nodes, edges]);

  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals);
  };

  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(1)}%`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-4">
        {/* Overview Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Overview
          </h3>
          <div className="space-y-2">
            <MetricRow label="Actors" value={metrics.actorCount.toString()} />
            <MetricRow label="Relations" value={metrics.relationCount.toString()} />
            <MetricRow
              label="Density"
              value={formatPercentage(metrics.density)}
              tooltip="Ratio of actual connections to maximum possible connections"
            />
            <MetricRow
              label="Avg Connections"
              value={formatNumber(metrics.averageConnections)}
              tooltip="Average number of relations per actor"
            />
          </div>
        </div>

        {/* Most Connected Actors Section */}
        {metrics.mostConnectedActors.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Most Connected Actors
            </h3>
            <div className="space-y-1">
              {metrics.mostConnectedActors.map((actor, index) => (
                <div
                  key={actor.actorId}
                  className={`flex items-center justify-between text-xs py-1 px-2 rounded ${
                    onActorClick
                      ? 'hover:bg-blue-50 cursor-pointer transition-colors'
                      : ''
                  }`}
                  onClick={() => onActorClick?.(actor.actorId)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 font-medium w-4">
                      {index + 1}.
                    </span>
                    <span className="text-gray-700 font-medium truncate max-w-[150px]">
                      {actor.actorLabel}
                    </span>
                  </div>
                  <span className="text-gray-500 ml-2">
                    {actor.degree} {actor.degree === 1 ? 'connection' : 'connections'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Graph Structure Section */}
        <div className="pt-3 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Graph Structure
          </h3>
          <div className="space-y-2">
            <MetricRow
              label="Isolated Actors"
              value={metrics.isolatedActorCount.toString()}
              icon={
                metrics.isolatedActorCount > 0 ? (
                  <WarningIcon className="text-orange-500" fontSize="small" />
                ) : undefined
              }
              tooltip="Actors with no connections to other actors"
              highlight={metrics.isolatedActorCount > 0 ? 'warning' : undefined}
            />
            <MetricRow
              label="Connected Components"
              value={metrics.connectedComponentCount.toString()}
              icon={
                metrics.connectedComponentCount > 1 ? (
                  <InfoIcon className="text-blue-500" fontSize="small" />
                ) : undefined
              }
              tooltip="Number of separate, disconnected subgraphs"
              highlight={metrics.connectedComponentCount > 1 ? 'info' : undefined}
            />
          </div>
        </div>

        {/* Actors by Type Section */}
        {metrics.actorsByType.size > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Actors by Type
            </h3>
            <div className="space-y-1">
              {Array.from(metrics.actorsByType.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <span className="text-gray-600 capitalize">{type}</span>
                    <span className="text-gray-500 font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Relations by Type Section */}
        {metrics.relationsByType.size > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Relations by Type
            </h3>
            <div className="space-y-1">
              {Array.from(metrics.relationsByType.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <span className="text-gray-600 capitalize">{type}</span>
                    <span className="text-gray-500 font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Empty graph state */}
        {metrics.actorCount === 0 && (
          <div className="text-center py-8 text-gray-400">
            <BarChartIcon fontSize="large" className="mb-2" />
            <p className="text-sm font-medium">No Data</p>
            <p className="text-xs mt-1">Add actors to see graph metrics</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * MetricRow - Single metric display with label and value
 */
interface MetricRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tooltip?: string;
  highlight?: 'warning' | 'info';
}

const MetricRow = ({ label, value, icon, tooltip, highlight }: MetricRowProps) => {
  const content = (
    <div
      className={`flex items-center justify-between text-xs py-1 px-2 rounded ${
        highlight === 'warning'
          ? 'bg-orange-50'
          : highlight === 'info'
            ? 'bg-blue-50'
            : ''
      }`}
    >
      <div className="flex items-center space-x-2">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="text-gray-600">{label}</span>
      </div>
      <span className="font-medium text-gray-800 ml-2">{value}</span>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="left">
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default GraphMetrics;
