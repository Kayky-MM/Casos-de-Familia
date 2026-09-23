import { anchorNode, getNodesToRemove, rebuildEdges, updateSingleNode } from '../utils/graphModifier';
import { handleRemoveRelation } from './handleRemoveRelation';
import { type StrategyContext, type GraphResult } from './index';

export function handleUpdate({ trigger, nodes, edges, onDetailClick, fetchedData }: StrategyContext): GraphResult {
    if (trigger.trigger !== 'update') return { nextNodes: nodes, nextEdges: edges };

    const {personId: mainNodeId} = trigger
    const mainNode = nodes.find(n => n.id === mainNodeId);
    // Se o nó não está no grafo, não há nada a fazer
    if (!mainNode) return {nextNodes: nodes, nextEdges: edges};
    
    if(trigger.relationsChanged){
        // Tratar cortes primeiro
        const {nextNodes: prevNodes, nextEdges: prevEdges} = handleRemoveRelation({trigger, nodes, edges, onDetailClick, fetchedData})
        
        const [workingNodes, confirmation] = anchorNode(mainNodeId, fetchedData[mainNodeId], prevNodes, prevEdges, fetchedData, onDetailClick);
    
        const nodesToRemove = getNodesToRemove(mainNodeId, fetchedData[mainNodeId], fetchedData, confirmation);
    
        const finalNodes = workingNodes.filter(n => !nodesToRemove.has(n.id));
    
        const newEdges = rebuildEdges(mainNodeId, fetchedData[mainNodeId], finalNodes, prevEdges, nodesToRemove, fetchedData);
    
        return {nextNodes: finalNodes, nextEdges: newEdges}
    }

    const nextNodes = updateSingleNode(mainNodeId, fetchedData[mainNodeId], nodes);
    return {nextNodes, nextEdges: edges}
} 