import { type StrategyContext, type GraphResult } from './index';

export interface PersonNodeData {
  father: string;
  mother: string;
  conjuge: string;
  children: string[];
}

export function handleRemoveRelation({ trigger, nodes, edges }: StrategyContext): GraphResult {
    // 1. Guarda de segurança para garantir a tipagem do trigger
    if (trigger.trigger !== 'update') return { nextNodes: nodes, nextEdges: edges };
    const { personId, removedFatherId, removedMotherId, removedConjugeId } = trigger;
    
    // ==========================================
    // 2. IDENTIFICAÇÃO DOS ALVOS (Targeting)
    // ==========================================
    const nodesToRemove = new Set<string>();
    
    // Adicionamos ao Set apenas as propriedades que vieram preenchidas com o ID (diferente de null)
    if (removedFatherId) nodesToRemove.add(removedFatherId);
    if (removedMotherId) nodesToRemove.add(removedMotherId);
    if (removedConjugeId) nodesToRemove.add(removedConjugeId);
    
    // Otimização: Se não houver relações a remover, devolvemos a malha intacta
    if (nodesToRemove.size === 0) return { nextNodes: nodes, nextEdges: edges };
    // Regra: "Cortar as arestas dos alvos envolvidos e atualizar referências (Ghost Reference cleanup)"
    const nextEdges = edges.filter(e => !((nodesToRemove.has(e.source) || nodesToRemove.has(e.target)) && (e.source === personId || e.target === personId)))

    return { nextNodes: nodes, nextEdges };
}