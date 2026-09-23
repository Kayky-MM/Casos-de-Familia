import type { Edge } from "@xyflow/react";
import { useCallback } from "react";

interface UseEdgeClickProps {
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export function useEdgeClick({setEdges}: UseEdgeClickProps){
    return useCallback(async (event: React.MouseEvent, edgeClicked: Edge) => {
        setEdges((eds) =>
          eds.map((e) => {
            if(edgeClicked.type === 'conjugeEdge'){
              return (e.id === edgeClicked.id) 
              ? { ...e, selected: true, zIndex: 10 } 
              : { ...e, selected: false, zIndex: (e.type === 'conjugeEdge') ? 5 : 0 }
            }else{
              return (e.type === 'childEdge' && e.target === edgeClicked.target) 
              ? {...e, selected: true, zIndex: 10}
              : {...e, selected: false, zIndex: (e.type === 'conjugeEdge') ? 5 : 0}
            }
          }
          )
        );
      }, [setEdges])
}