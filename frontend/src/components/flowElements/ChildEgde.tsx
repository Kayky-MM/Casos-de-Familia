import { BaseEdge, useInternalNode, type EdgeProps } from '@xyflow/react';

export function ChildEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  data
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const conjugeId = data?.conjugeId as string | undefined;
  const conjugeNode = useInternalNode(conjugeId || ''); 

  let cx = sourceX; 

  if (sourceNode && conjugeNode) {
    const centerSourceX = sourceNode.position.x + (sourceNode.measured?.width || 100) / 2;
    const centerConjugeX = conjugeNode.position.x + (conjugeNode.measured?.width || 100) / 2;
    cx = (centerSourceX + centerConjugeX) / 2;
  }
  
  const cy = sourceY + (targetY - sourceY)*0.8;

  const edgePath = `M ${sourceX} ${sourceY} L ${cx} ${sourceY} L ${cx} ${cy} L ${targetX} ${cy} L ${targetX} ${targetY}`;

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