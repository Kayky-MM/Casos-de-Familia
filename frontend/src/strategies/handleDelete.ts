import { type StrategyContext, type GraphResult } from './index';

export interface PersonNodeData {
  father: string;
  mother: string;
  conjuge: string;
  children: string[];
}

export function handleDelete({ trigger, nodes, edges }: StrategyContext): GraphResult {
    // 1. Guarda de segurança
    if (trigger.trigger !== 'delete') return { nextNodes: nodes, nextEdges: edges };

    const mainNodeId = trigger.personId;

    // Regra: "Apenas remover o mainNode"
    const nextNodes = nodes.filter((n) => n.id !== mainNodeId)

    // Regra: "Remover todas as arestas relacionadas ao mainNode"
    const nextEdges = edges
        // Corta todas as conexões diretas (seja como origem ou destino)
        .filter(edge => edge.source !== mainNodeId && edge.target !== mainNodeId)
        .map(edge => {
            // Limpeza de Segurança (Ghost Reference Cleanup)
            if (edge.type === 'childEdge' && edge.data?.conjugeId === mainNodeId) {
                return {
                    ...edge,
                    sourceHandle: 'single',
                    data: {
                        ...edge.data,
                        conjugeId: undefined // Remove a referência da pessoa deletada
                    }
                };
            }
            return edge;
        });

    return { nextNodes, nextEdges };
}