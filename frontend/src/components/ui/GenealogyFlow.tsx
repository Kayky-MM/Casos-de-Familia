import { Background, BackgroundVariant, ConnectionMode, Panel, ReactFlow } from "@xyflow/react";
import { useGenealogyGraph } from "../../hooks/useGenealogyGraph";
import { edgeTypes, nodeTypes } from "../../types/NodeTypes";
import { GraphSearchBar } from "../major/GraphSearchBar";

export function GenealogyFlow(props) {
  const {onDetailClick, refreshTrigger, handleAddPerson, loggedPersonId} = props
  
  const { nodes, edges, onNodesChange, onEdgesChange, onNodeClick, onEdgeClick } = useGenealogyGraph(loggedPersonId, onDetailClick, refreshTrigger);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      connectionMode={ConnectionMode.Strict}
      fitView
    >
      <Panel position="top-right">
        <GraphSearchBar onDetailClick={onDetailClick}/>
      </Panel>
      
      <Panel position="top-left" className="react-flow-panel-fixo">
                <button 
                    className="btn-adicionar-pessoa"
                    onClick={handleAddPerson}
                >
                    + Adicionar Pessoa
                </button>
      </Panel>
      <Background
        style={{ backgroundColor: 'var(--bg-color-primary)' }} 
      />
    </ReactFlow>
  );
}