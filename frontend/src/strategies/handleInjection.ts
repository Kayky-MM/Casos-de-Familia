import type { GraphResult, StrategyContext } from ".";
import { anchorNode, getNodesToRemove, rebuildEdges } from "../utils/graphModifier";

export function handleInjection({ trigger, nodes, edges, onDetailClick, fetchedData }: StrategyContext) : GraphResult & {centerX: number, centerY: number} {
    if(trigger.trigger !== 'inject') return {nextNodes: nodes, nextEdges: edges, centerX: 0, centerY: 0};
    const {personId} = trigger
    
    const nodeInGraph = nodes.find(n => n.id === personId);

    if(nodeInGraph) return {nextNodes: nodes, nextEdges: edges, centerX: nodeInGraph.position.x, centerY: nodeInGraph.position.y};

    const [workingNodes, confirmation] = anchorNode(personId, fetchedData[personId], nodes, edges, fetchedData, onDetailClick, false)

    const nodesToRemove = getNodesToRemove(personId, fetchedData[personId], fetchedData, confirmation);

    const finalNodes = workingNodes.filter(n => !nodesToRemove.has(n.id))

    const nextEdges = rebuildEdges(personId, fetchedData[personId], finalNodes, edges, nodesToRemove, fetchedData);
    
    const mainNode = workingNodes.find(n => n.id === personId);

    return { nextNodes: finalNodes, nextEdges: nextEdges, centerX: mainNode!.position.x, centerY: mainNode!.position.y };
}