import type { Node, Edge, XYPosition } from "@xyflow/react";
import { MiniCard } from "../components/flowElements/MiniCard";
import { ChildEdge } from "../components/flowElements/ChildEgde";
import { ConjugeEdge } from "../components/flowElements/ConjugeEdge";

export const nodeTypes = {
    miniCard: MiniCard
}

export const edgeTypes = {
    childEdge: ChildEdge,
    conjugeEdge: ConjugeEdge
}

interface NodeData {
    right: boolean;
    nome: string;
    onClick: (arg0: React.MouseEvent, arg1: string) => void;
    layer: number;
    imgUrl?: string | null;
}

export function createNode(id: string, type: string, position : XYPosition, data: NodeData) : Node {
    return {id, draggable: false, type, position, data: {...data}}
}


export function createEdge(source: string, target: string, type : string, sourceHandle: string, targetHandle: string, data? : {conjugeId: string | undefined}): Edge {
    return { id: `e${source}-${target}`, source, target, sourceHandle, targetHandle, type, data }
}