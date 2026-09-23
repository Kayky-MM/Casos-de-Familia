// useNodeClick.ts
import { useCallback } from 'react';
import type { Node, Edge, ReactFlowInstance } from '@xyflow/react';
import { handleClick } from '../strategies/handleClick';
import { fetchPersonWithFamily } from '../utils/fetchPerson';

interface UseNodeClickProps {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onDetailClick: (e: React.MouseEvent, id: string) => void;
  reactFlow: ReactFlowInstance;
}

export const useNodeClick = ({ reactFlow, setNodes, setEdges , onDetailClick }: UseNodeClickProps) => {
  return useCallback(async (event: React.MouseEvent, node: Node) => {

    const clickedId = node.id;
      const nodes = reactFlow.getNodes();
      const edges = reactFlow.getEdges();
      try {
        const fetchedData = await fetchPersonWithFamily(clickedId)
        
          const {nextNodes, nextEdges} = handleClick({
            trigger: {
              trigger: "click",
              personId: clickedId
            },
            fetchedData: fetchedData,
            nodes: nodes,
            edges: edges,
            onDetailClick
          })
          
          setNodes(nextNodes)
          setEdges(nextEdges)
    
      } catch (error) {
        setNodes(nodes);
        setEdges(edges);
      }
  }, [ setNodes, setEdges, onDetailClick, reactFlow]);
};