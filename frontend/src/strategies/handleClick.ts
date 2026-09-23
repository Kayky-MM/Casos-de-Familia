import type { StrategyContext, GraphResult } from './index';
import { addNodes, getNodesToRemove, rebuildEdges } from '../utils/graphModifier';

export function handleClick(context: StrategyContext): GraphResult {
  const { trigger, fetchedData, nodes, edges, onDetailClick } = context;

  const clickedId = trigger.personId;
  const targetNode = nodes.find((n) => n.id === clickedId);

  // Guard Clauses: Se o nó não existir, já tiver sido clicado ou não tiver dados carregados
  if (!targetNode) {
    return { nextNodes: nodes, nextEdges: edges };
  }
  const relatives = fetchedData[clickedId];
  const currentLayer = (targetNode.data.layer as number) ?? 0;
  
  const [nextNodes, confirmation] = addNodes( clickedId, targetNode.position, currentLayer, onDetailClick, relatives, fetchedData, nodes, edges);
  
  const nodesToRemove = getNodesToRemove(clickedId, relatives, fetchedData, confirmation);

  const filteredNodes = nextNodes.filter(n => !nodesToRemove.has(n.id));


  const nextEdges = rebuildEdges(clickedId, relatives, filteredNodes, edges, nodesToRemove, fetchedData)

  return {
    nextNodes: filteredNodes,
    nextEdges,
  };
}