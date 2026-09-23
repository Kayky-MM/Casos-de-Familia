import { type StrategyContext, type GraphResult } from './index';
import { anchorNode, getNodesToRemove, rebuildEdges } from '../utils/graphModifier';

export function handleAdd({ trigger, nodes, edges, onDetailClick, fetchedData }: StrategyContext): GraphResult {
    if (trigger.trigger !== 'add') return { nextNodes: nodes, nextEdges: edges };

    const { personId: mainNodeId} = trigger;
    
    const [workingNodes, confirmation] = anchorNode(mainNodeId, fetchedData[mainNodeId], nodes, edges, fetchedData, onDetailClick);

    const nodesToRemove = getNodesToRemove(mainNodeId, fetchedData[mainNodeId], fetchedData, confirmation);
    
    const nextNodes = workingNodes.filter(n => !nodesToRemove.has(n.id))
    
    const nextEdges = rebuildEdges(mainNodeId, fetchedData[mainNodeId], nextNodes, edges, nodesToRemove, fetchedData);

    return { nextNodes: nextNodes, nextEdges: nextEdges };
}