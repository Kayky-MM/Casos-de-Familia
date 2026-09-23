import { useState, useCallback, useEffect } from 'react';
import { type Node, type Edge, applyNodeChanges, applyEdgeChanges, useReactFlow } from '@xyflow/react';
import { createNode } from '../types/NodeTypes';
import { processGraphUpdate } from '../strategies';
import { fetchPerson, fetchPersonWithFamily } from '../utils/fetchPerson';
import { useNodeClick } from './useNodeClick';
import { useEdgeClick } from './useEdgeClick';
import type { RefreshTrigger } from '../types/refreshTrigger';
import type { Pessoa } from '../types/Responses';
import { LAYOUT } from '../utils/layout';
import { useNavigate } from 'react-router-dom';

export function useGenealogyGraph(userId: number, onDetailClick, refreshTrigger: RefreshTrigger) {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const reactFlow = useReactFlow();

  useEffect(() => {
    async function loadInitialTree() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/people/${userId}`, {
          credentials: "include"
        });

        if(!res.ok && res.status === 401){
          alert("Usuário não autenticado");
          throw new Error("Não autenticado");
        }

        const person : Pessoa = await res.json();
        const rootNode = createNode(
          person.id.toString(), 
          'miniCard',
          { x: LAYOUT.INITIAL_CENTER.X, y: LAYOUT.INITIAL_CENTER.Y },
          {right: true, nome: person.nome, layer: 0, onClick: onDetailClick, imgUrl: person.avatarUrl}
        );

        setNodes([rootNode]);
        
      } catch (error) {
        navigate('/');
      }
    }

    loadInitialTree();
  }, [userId, onDetailClick, navigate]); 

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  useEffect(() => {
  async function refreshPeople() {
    if (!refreshTrigger) return;

    // 1. Fetch dos dados necessários de forma genérica
    const fetchedData = (refreshTrigger.trigger === 'update' && !refreshTrigger.relationsChanged) ? await fetchPerson(refreshTrigger.personId) : await fetchPersonWithFamily(refreshTrigger.personId);

    if(!fetchedData){
      return;
    }
    // 2. Processamos os novos arrays de estado em memória (Função Pura)
    const currentNodes = reactFlow.getNodes();
    const currentEdges = reactFlow.getEdges();
    
    const { nextNodes, nextEdges } = processGraphUpdate({
      trigger: refreshTrigger,
      fetchedData,
      nodes: currentNodes,
      edges: currentEdges,
      onDetailClick,
    });

    // 3. Atualização única em lote (Batch Update)
    setNodes(nextNodes);
    setEdges(nextEdges);
  }

  refreshPeople();
}, [refreshTrigger, reactFlow, onDetailClick]);

  const onNodeClick = useNodeClick({
    reactFlow,
    setNodes,
    setEdges,
    onDetailClick
  });

  const onEdgeClick = useEdgeClick({setEdges})

  return { nodes, edges, onNodesChange, onEdgesChange, onNodeClick, onEdgeClick };
}