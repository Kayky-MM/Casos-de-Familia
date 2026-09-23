import { BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/react';

export function ConjugeEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    selected
}: EdgeProps) {
    const [edgePath] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });

    const edgeColor = selected ? 'var(--color-quaternary)' : 'var(--color-terciary)';
    const edgeWidth = selected ? '7' : '5';
    const edgeFilter = selected ? 'drop-shadow(0px 0px 4px rgba(0,0,0,0.5))' : 'none';

    return <BaseEdge id={id} path={edgePath}
    style={{
          stroke: edgeColor, 
          strokeWidth: edgeWidth, 
          filter: edgeFilter,
          transition: 'all 0.2s ease'
        }}/>;
}