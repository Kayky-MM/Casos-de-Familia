import { type Node, type Edge } from '@xyflow/react';
import { LAYOUT } from './layout';
/**
 * Insere um novo nó resolvendo colisões espaciais e deslocando nós em cascata.
 * * @param newNode O nó que será inserido
 * @param currentNodes O estado atual de nós do grafo
 * @param edges O estado atual de arestas (usado para checar relações de cônjuge)
 * @param shiftDistance A distância do empurrão (normalmente a largura do card 'w')
 */
export function insertNodeWithCollision(
  newNode: Node,
  currentNodes: Node[],
  edges: Edge[]
): Node[] {
  const shiftDistance = LAYOUT.CARD_WIDTH;
  const layer = newNode.data.layer as number;
  const targetX = newNode.position.x;

  const nodesInLayer = currentNodes.filter((n) => n.data.layer === layer);

  const collidedNode = nodesInLayer.find((n) => n.position.x === targetX);

  if(currentNodes.some(n => n.id === newNode.id)){
    return currentNodes;
  }
  if (!collidedNode) {
    return [...currentNodes, newNode];
  }

  let pushDirection: 'left' | 'right' = 'right'; 

  const spouseEdge = edges.find(
    (e) =>
      e.type === 'conjugeEdge' &&
      (e.source === collidedNode.id || e.target === collidedNode.id)
  );
  if (spouseEdge) {
    const spouseId = spouseEdge.source === collidedNode.id ? spouseEdge.target : spouseEdge.source;
    const spouseNode = nodesInLayer.find((n) => n.id === spouseId);
    if (spouseNode && (spouseNode.position.x < collidedNode.position.x)) {
      pushDirection = 'left';
    }
  }
  const shiftedNodes = currentNodes.map((node) => {
    // Só desloca nós da mesma camada
    if (node.data.layer !== layer) return node;
    if (pushDirection === 'left') {
      // Empurra o colidido e todos à ESQUERDA dele
      if (node.position.x <= collidedNode.position.x) {
        return {
          ...node,
          position: { ...node.position, x: node.position.x - 2*shiftDistance },
        };
      }
    } else {
      // Empurra o colidido e todos à DIREITA dele
      if (node.position.x >= collidedNode.position.x) {
        return {
          ...node,
          position: { ...node.position, x: node.position.x + 2*shiftDistance },
        };
      }
    }

    return node;
  });

  return [...shiftedNodes, newNode];
}