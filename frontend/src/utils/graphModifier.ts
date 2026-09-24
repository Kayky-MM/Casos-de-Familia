import type { Edge, Node, XYPosition } from "@xyflow/react";
import {type RelativesResponse } from "../types/Responses";
import { createEdge, createNode } from "../types/NodeTypes";
import { insertNodeWithCollision } from "./collisionManager";
import { LAYOUT } from "./layout";
import type React from "react";


interface Confirmation {
  father: boolean;
  mother: boolean;
  conjuge: boolean;
  children: Record<string, boolean>;
}

export function getNodesToRemove(
  clickedId: string,
  clickedData: RelativesResponse,
  fetchedData: Record<string, RelativesResponse>,
  confirmation: Confirmation
): Set<string> {
  const idsToRemove = new Set<string>();
  const clickedChildrenIds = clickedData.children.map(c => c.id.toString());
  const clickedFatherId = clickedData.parents.father?.id.toString();
  const clickedMotherId = clickedData.parents.mother?.id.toString();
  const clickedConjugeId = clickedData.conjuge?.id.toString();

  // 1. Poda do Pai (Avós, madrasta, irmãos do clickedNode)
  if (confirmation.father && clickedFatherId) {
    const fatherData = fetchedData[clickedFatherId];
    if (fatherData) {
      if (fatherData.parents.father) idsToRemove.add(fatherData.parents.father.id.toString());
      if (fatherData.parents.mother) idsToRemove.add(fatherData.parents.mother.id.toString());
      // Madrasta (cônjuge do pai que não é a mãe do clickedNode)
      if (fatherData.conjuge && fatherData.conjuge.id.toString() !== clickedMotherId) {
        idsToRemove.add(fatherData.conjuge.id.toString());
      }
      fatherData.children.forEach(c => {
        if (c.id.toString() !== clickedId) idsToRemove.add(c.id.toString());
      });
    }
  }

  // 2. Poda da Mãe (Avós, padrasto, irmãos do clickedNode)
  if (confirmation.mother && clickedMotherId) {
    const motherData = fetchedData[clickedMotherId];
    if (motherData) {
      if (motherData.parents.father) idsToRemove.add(motherData.parents.father.id.toString());
      if (motherData.parents.mother) idsToRemove.add(motherData.parents.mother.id.toString());
      // Padrasto (cônjuge da mãe que não é o pai do clickedNode)
      if (motherData.conjuge && motherData.conjuge.id.toString() !== clickedFatherId) {
        idsToRemove.add(motherData.conjuge.id.toString());
      }
      motherData.children.forEach(c => {
        if (c.id.toString() !== clickedId) idsToRemove.add(c.id.toString());
      });
    }
  }

  // 3. Poda do Cônjuge (Sogros e enteados)
  if (confirmation.conjuge && clickedConjugeId) {
    const conjugeData = fetchedData[clickedConjugeId];
    if (conjugeData) {
      if (conjugeData.parents.father) idsToRemove.add(conjugeData.parents.father.id.toString());
      if (conjugeData.parents.mother) idsToRemove.add(conjugeData.parents.mother.id.toString());
      conjugeData.children.forEach(c => {
        if (!clickedChildrenIds.includes(c.id.toString())) {
          idsToRemove.add(c.id.toString());
        }
      });
    }
  }

  // 4. Poda dos Filhos (Genro/nora, netos e genitor que não seja o cônjuge)
  clickedData.children.forEach(child => {
    const childId = child.id.toString();
    if(!confirmation.children[childId]) return;
    const childData = fetchedData[childId];
    if (childData) {
      const fatherChildId = childData.parents.father?.id.toString();
      const motherChildId = childData.parents.mother?.id.toString();
      if (fatherChildId && fatherChildId !== clickedId && fatherChildId !== clickedConjugeId) idsToRemove.add(fatherChildId);
      if (motherChildId && motherChildId !== clickedId && motherChildId !== clickedConjugeId) idsToRemove.add(motherChildId);
      if (childData.conjuge) idsToRemove.add(childData.conjuge.id.toString()); // Genro/nora
      childData.children.forEach(grandchild => idsToRemove.add(grandchild.id.toString())); // Netos
    }
  });

  const directRelativesIds = new Set([
    clickedId,
    clickedFatherId,
    clickedMotherId,
    clickedConjugeId,
    ...clickedChildrenIds
  ].filter(Boolean));

  directRelativesIds.forEach(id => idsToRemove.delete(id!));

  return idsToRemove;
}

export function rebuildEdges(
  clickedId: string,
  clickedData: RelativesResponse,
  currentNodes: Node[],
  oldEdges: Edge[],
  idsToRemove: Set<string>,
  fetchedData: Record<string, RelativesResponse>
): Edge[] {
  // 1. Limpa arestas antigas conectadas a nós removidos
  idsToRemove.add(clickedId); // refresh
  let activeEdges = oldEdges.filter(e => !idsToRemove.has(e.source) && !idsToRemove.has(e.target))
  .map(e => {
    return (e.type === 'childedge' && idsToRemove.has(e.data?.conjugeId as string)) ? {...e, sourceHandle: 'single', data: {conjugeId : undefined}} : e
  });

  const nodeExists = (id: string | undefined) => currentNodes.some(n => n.id === id);

  const addEdge = (source: string, target: string, type: string, sourceHandle: string, targetHandle: string, data? : {conjugeId: string | undefined}) => {
    const exists = activeEdges.some(e => e.source === source && e.target === target);
    if (!exists && nodeExists(source) && nodeExists(target)) {
      activeEdges.push(createEdge(source, target, type, sourceHandle, targetHandle, data));
    }
  };
  const removeEdge = (source: string, target: string) => activeEdges.filter(e => !(e.source === source && e.target === target));

  const fatherId = clickedData.parents.father?.id.toString();
  const motherId = clickedData.parents.mother?.id.toString();
  const conjugeId = clickedData.conjuge?.id.toString();

  // Conexões de Pais e Casamento
  const areMarried = clickedData.parents.married
  if (fatherId && motherId && areMarried) {
    addEdge(fatherId, motherId, 'conjugeEdge', 'relationship', 'weeding');
  }
  const parentsInGraph = areMarried && nodeExists(fatherId) && nodeExists(motherId);

  if (fatherId) addEdge(fatherId, clickedId, 'childEdge', (parentsInGraph) ? 'relationship' : 'single', 'parentship', {conjugeId: (parentsInGraph) ? motherId : undefined});
  if (motherId) addEdge(motherId, clickedId, 'childEdge', (parentsInGraph) ? 'relationship' : 'single', 'parentship', {conjugeId: (parentsInGraph) ? fatherId : undefined});

  // Conexão do Cônjuge
  if (conjugeId) addEdge(clickedId, conjugeId, 'conjugeEdge', 'relationship', 'weeding');

  // Conexões dos Filhos
  clickedData.children.forEach(child => {
    const childId = child.id.toString();
    const bothParents = conjugeId && fetchedData[childId] && (fetchedData[childId].parents.father?.id.toString() === conjugeId || fetchedData[childId].parents.mother?.id.toString() === conjugeId) && nodeExists(conjugeId)
    addEdge(clickedId, childId, 'childEdge', (bothParents) ? 'relationship' : 'single', 'parentship', {
        conjugeId: bothParents ? conjugeId : undefined
    });

    // Verifica se o filho também é do cônjuge para traçar a aresta
    if (bothParents) {
      activeEdges = removeEdge(conjugeId, childId);
      addEdge(conjugeId, childId, 'childEdge', 'relationship', 'parentship', {conjugeId: clickedId})
    }
  });

  return activeEdges;
}

function adjustRightFlag(firstNodeId : string | undefined, secondNodeId: string | undefined, nodes : Node[]) : Node[]{
  if(firstNodeId && secondNodeId){
    const firstNode = nodes.find(n => n.id === firstNodeId);
    const secondNode = nodes.find(n => n.id === secondNodeId);
    if(firstNode && secondNode){
      nodes = nodes.map(n => {
        if(n.id === firstNodeId){
          return (firstNode.position.x < secondNode.position.x) ? {...n, data: {...n.data, right: true}} : {...n, data: {...n.data, right: false}}
        }
        if(n.id === secondNodeId){
          return (firstNode.position.x < secondNode.position.x) ? {...n, data: {...n.data, right: false}} : {...n, data: {...n.data, right: true}}
        }
        return n;
      })
    }
  }
  return nodes
}

export function addNodes(
  // clickedId: string,
  clickedPosition: XYPosition,
  clickedLayer: number,
  onDetailClick: (arg0: React.MouseEvent, arg1: string) => void,
  clickedData: RelativesResponse,
  // fetchedData: Record<string, RelativesResponse>,
  currentNodes: Node[],
  currentEdges: Edge[]
): [Node[], Confirmation] {

    let nextNodes = [...currentNodes]
    const nodeExists = (id: string) => currentNodes.some((n) => n.id === id);
    const { x, y } = clickedPosition;
    const motherId = clickedData?.parents?.mother?.id;
    const conjugeId = clickedData?.conjuge?.id; // corrigido
    const fatherId = clickedData?.parents?.father?.id;
    const confirmation: Confirmation = {
      father: false,
      mother: false,
      conjuge: false,
      children: clickedData.children.reduce<Record<string, boolean>>((children, child) => {
        children[String(child.id)] = false;
        return children;
      }, {})
    }
    
    if (fatherId && !nodeExists(fatherId.toString())) {
        const fatherData = clickedData.parents.father

        const newNode = createNode(
        String(fatherId),
        'miniCard',
        { x: x - LAYOUT.CARD_WIDTH, y: y - LAYOUT.VERTICAL_GAP },
        { right: true, nome: fatherData!.nome, layer: clickedLayer - 1, onClick: onDetailClick, imgUrl: fatherData?.avatarUrl}
        );
  
        nextNodes = insertNodeWithCollision(newNode, nextNodes, currentEdges);
        confirmation.father = true // flag
    }

  // Mãe
  if (motherId && !nodeExists(motherId.toString())) {
    const motherData = clickedData.parents.mother
    const newNode = createNode(
      String(motherId),
      'miniCard',
      { x: x + LAYOUT.CARD_WIDTH, y: y - LAYOUT.VERTICAL_GAP },
      { right: true, nome: motherData!.nome, layer: clickedLayer - 1, onClick: onDetailClick,imgUrl: motherData?.avatarUrl}
    );
    nextNodes = insertNodeWithCollision(newNode, nextNodes, currentEdges);
    confirmation.mother = true // flag
  }

  // Ajuste da flag right
  nextNodes = adjustRightFlag(String(fatherId), String(motherId),nextNodes);

  // Cônjuge
  if (conjugeId && !nodeExists(conjugeId.toString())) {
    const conjugeData = clickedData.conjuge;

    const newNode = createNode(
      String(conjugeId),
      'miniCard',
      { x: x + 2 * LAYOUT.CARD_WIDTH, y },
      { right: false, nome: conjugeData!.nome, layer: clickedLayer, onClick: onDetailClick, imgUrl: conjugeData?.avatarUrl}
    );
    nextNodes = insertNodeWithCollision(newNode, nextNodes, currentEdges);
    confirmation.conjuge = true // flag
  }

  // Filhos
  if (clickedData.children && clickedData.children.length > 0) {
    const notAddedChildren = clickedData.children.filter(
      (child) => !nodeExists(child.id.toString())
    );

    notAddedChildren.forEach((child, index) => {
      const offsetX = (2 * index + 1) * LAYOUT.CARD_WIDTH;
      const childId = child.id.toString();
      const newNode = createNode(
        childId,
        'miniCard',
        { x: x + offsetX, y: y + LAYOUT.VERTICAL_GAP },
        { right: true, nome: child.nome, layer: clickedLayer + 1, onClick: onDetailClick, imgUrl: child.avatarUrl}
      );
      nextNodes = insertNodeWithCollision(newNode, nextNodes, currentEdges);
      confirmation.children[childId] = true // de fato essa era a intenção, marcar true apenas quando for adicionado agora
    });
  }

  return [nextNodes, confirmation];
}

function getRightmostNode(nodes: Node[]): Node | null {
    if (nodes.length === 0) return null;
    return nodes.reduce((prev, current) => 
        (current.position.x > prev.position.x) ? current : prev
    );
}

/**
 * Ancora a pessoa com prioridade para pais > cônjuge > filhos
 * @param personId id da pessoa que quer ser ancorada
 * @param personData 
 * @param currentNodes 
 * @param currentEdges 
 * @param fetchedData 
 * @param onDetailClick 
 * @returns [nós, confirmação de que nós problemáticos excluir]
 */
export function anchorNode(
  personId : string,
  personData : RelativesResponse,
  currentNodes : Node[],
  currentEdges : Edge[],
  fetchedData: Record<string, RelativesResponse>,
  onDetailClick: (arg0: React.MouseEvent, arg1: string) => void,
  addOnFly: boolean = true
) : [Node[], Confirmation] {
  const fatherId = personData.parents.father?.id
  const motherId = personData.parents.mother?.id
  const conjugeId = personData.conjuge?.id
  const childrenIds = personData.children.reduce<Set<string>>((set, c) => set.add(String(c.id)), new Set<string>());

  const parentIds = [fatherId, motherId].filter(Boolean).map(id => String(id));
  let workingNodes = [...currentNodes]
  const parents = workingNodes.filter(n => parentIds.includes(n.id));
  const confirmation : Confirmation = {father: false, mother: false, conjuge: false, children: personData.children.reduce<Record<string, boolean>>((children, child) => {
        children[String(child.id)] = false;
        return children;
      }, {})}
  
  const nodeExists = (nodeId: number | undefined) => workingNodes.some(n => +n.id === nodeId); 
  // ==========================================
  // 3. CÁLCULO DA LANDING ZONE
  // ==========================================
  let mainX: number;
  let mainY: number;
  let mainLayer: number;
  const existingSpouse = workingNodes.find(n => n.id === String(conjugeId))
  const isRight = existingSpouse && existingSpouse.data.right as boolean
  
  const existingChild = workingNodes.find(n => childrenIds.has(n.id))
  let anchorType : 'parents' | 'spouse' | 'child' |'none' = 'none'
  // âncora nos pais
  if (parents.length > 0) {
    const primaryParent = parents[0];
    mainX = primaryParent.position.x + LAYOUT.CARD_WIDTH;
    mainY = primaryParent.position.y + LAYOUT.VERTICAL_GAP;
    mainLayer = ((primaryParent.data.layer as number) || 0) + 1;
    anchorType = 'parents'
  }
  // âncora no cônjuge 
  else if(existingSpouse) {
    const {x: spouseX, y: spouseY} = existingSpouse.position
    mainX = isRight ? spouseX + 2*LAYOUT.CARD_WIDTH : spouseX - 2*LAYOUT.CARD_WIDTH;
    mainY = spouseY
    mainLayer = (existingSpouse.data.layer as number) 
    anchorType = 'spouse'
  }
  // âncora em um filho
  else if(existingChild) {
    const {x: childX, y: childY} = existingChild.position
    mainX = childX - LAYOUT.CARD_WIDTH;
    mainY = childY - LAYOUT.VERTICAL_GAP
    mainLayer = (existingChild.data.layer as number) - 1 
    anchorType = 'child'
  }
  // sem âncora
  else {
    const rightmost = getRightmostNode(workingNodes);
    mainX = rightmost ? rightmost.position.x + (LAYOUT.CARD_WIDTH * 2) : 0;
    mainY = LAYOUT.INITIAL_CENTER.Y;
    mainLayer = 0;
  }
  
  // ==========================================
  // 4. INSERÇÃO DOS NÓS (Pessoa e Cônjuge)
  // ==========================================
  const childrenBaseX = mainX + LAYOUT.CARD_WIDTH, childrenBaseY = mainY + LAYOUT.VERTICAL_GAP; 

  workingNodes = workingNodes.filter(n => n.id !== personId);
  const newMainNode = createNode(
    personId,
    'miniCard',
      { x: mainX, y: mainY },
      { right: !(isRight && anchorType === 'spouse'), nome: personData.person.nome, layer: mainLayer, onClick: onDetailClick, imgUrl: personData.person.avatarUrl} 
    );
    workingNodes = insertNodeWithCollision(newMainNode, workingNodes, currentEdges);
    
    if(conjugeId && (nodeExists(conjugeId) || addOnFly) && anchorType !== 'spouse') {
      workingNodes = workingNodes.filter(n => n.id !== String(conjugeId))
      const spouseNode = createNode(
        String(conjugeId),
        'miniCard',
        {x: mainX + 2*LAYOUT.CARD_WIDTH, y: mainY}, {right: false, nome: fetchedData[conjugeId].person.nome, layer: mainLayer, onClick: onDetailClick, imgUrl: fetchedData[conjugeId].person.avatarUrl}
      )
      workingNodes = insertNodeWithCollision(spouseNode, workingNodes, currentEdges)
      confirmation.conjuge = true
    }

    // mudança de posição, se eu ancorei o nó na esposa, e os pais não estavam, então eu devo trazê los pra perto do mainNode
    if ((nodeExists(fatherId) || nodeExists(motherId) || addOnFly) && parents.length === 0 && parentIds.length > 0 && anchorType !== 'parents') {
    let parentBaseX = mainX - LAYOUT.CARD_WIDTH;
    const parentBaseY = mainY - LAYOUT.VERTICAL_GAP;

    if (fatherId && fetchedData[fatherId]) {
        workingNodes = workingNodes.filter(n => +n.id !== fatherId)
        const newFather = createNode(
            String(fatherId),
            'miniCard',
            { x: parentBaseX, y: parentBaseY },
            { right: true, nome: fetchedData[fatherId].person.nome, layer: -1, onClick: onDetailClick, imgUrl: fetchedData[fatherId].person.avatarUrl} 
        );
        workingNodes = insertNodeWithCollision(newFather, workingNodes, currentEdges);
        parentBaseX += LAYOUT.CARD_WIDTH * 2;
        confirmation.father = true
    }

    if (motherId && fetchedData[motherId]) {
        workingNodes = workingNodes.filter(n => +n.id !== motherId)
        const newMother = createNode(
            String(motherId),
            'miniCard',
            { x: parentBaseX, y: parentBaseY },
            { right: true, nome: fetchedData[motherId].person.nome, layer: -1, onClick: onDetailClick, imgUrl: fetchedData[motherId].person.avatarUrl} 
        );
        workingNodes = insertNodeWithCollision(newMother, workingNodes, currentEdges);
        confirmation.mother = true
    }

    workingNodes = adjustRightFlag(String(fatherId), String(motherId), workingNodes)
  }

  // Filhos ancorados no pai
    const childrenNodesOriginal = workingNodes.filter(n => childrenIds.has(n.id) && n.id !== existingChild?.id)
    workingNodes = workingNodes.filter(n => !childrenIds.has(String(n.id)) || n.id === existingChild?.id)
    childrenNodesOriginal.forEach(childNode => {
      const updatedChild = createNode(
              childNode.id, 
              'miniCard', 
              { x: childrenBaseX, y: childrenBaseY }, 
              { right: true, nome: childNode.data.nome as string, layer: mainLayer + 1, onClick: onDetailClick, imgUrl: childNode.data.imgUrl as string} 
          );
          
          workingNodes = insertNodeWithCollision(
              updatedChild, 
              workingNodes, 
              currentEdges
          );
  
          confirmation.children[childNode.id] = true
      });

  return [workingNodes, confirmation]
}

export function updateSingleNode(
  personId: string,
  personData: RelativesResponse,
  nodes: Node[]
) : Node[] {
  return nodes.map(n => {
    if(n.id !== personId) return n;
    return createNode(personId, 'miniCard', n.position, {
      right: n.data?.right as boolean,
      nome: personData.person.nome,
      onClick: n.data?.onClick as (arg0: React.MouseEvent, arg1: string) => void,
      layer: n.data?.layer as number,
      imgUrl: personData.person.avatarUrl
    })
  })
}