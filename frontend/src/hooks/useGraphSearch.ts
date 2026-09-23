import { useState, useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { processGraphUpdate } from '../strategies';
import { fetchPersonWithFamily } from '../utils/fetchPerson';
import type { RefreshTrigger } from '../types/refreshTrigger';
import { LAYOUT } from '../utils/layout';


export function useGraphSearch(onDetailClick) {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [hasSearched, setHasSearched] = useState(false); 
    
    // Ferramentas da câmera e nós do React Flow
    const { getNodes, getEdges, setNodes, setEdges, setCenter } = useReactFlow();
    
    // Função central que faz a requisição
    const executeSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setCurrentIndex(-1);
            setHasSearched(false);
            return;
        }
        
        setIsLoading(true);
        setHasSearched(true);
        
        try {
            const url = import.meta.env.VITE_API_URL;
            const response = await fetch(`${url}/people?search=${encodeURIComponent(searchQuery)}`, {
                credentials: "include"
            });
            if (!response.ok) throw new Error('Erro na busca da API');
            
            const data = await response.json();
            setResults(data);
            
            // Se vieram resultados, foca automaticamente no primeiro
            if (data.length > 0) {
                setCurrentIndex(0);
            } else {
                setCurrentIndex(-1);
            }
        } catch (error) {
            setResults([]);
            setCurrentIndex(-1);
        } finally {
            setIsLoading(false);
        }
    }, [])

    const handleSearch = useCallback(async () => {
        await executeSearch(query);
    }, [executeSearch, query]);

    // 2. A Câmera (Foca no nó sempre que o currentIndex mudar)
    useEffect(() => {
        async function focusOnNode(){
            if (currentIndex >= 0 && results.length > 0) {
                const person = results[currentIndex];
                const personId = String(person.id);
                const nodes = getNodes();
                const edges = getEdges();
                // Verifica se a pessoa já está renderizada no grafo
                const nodeInGraph = nodes.find(n => n.id === personId);
                
                if (nodeInGraph) {
                    setCenter(
                        nodeInGraph.position.x + (LAYOUT.CARD_WIDTH/2), 
                        nodeInGraph.position.y + (LAYOUT.CARD_HEIGHT/2), 
                        { zoom: 1.2, duration: 800 } 
                    );
                } else {
                    const trigger : RefreshTrigger = {trigger: 'inject', personId: personId}
                    const fetchedData = await fetchPersonWithFamily(personId)
                    const {nextNodes, nextEdges, centerX, centerY} = processGraphUpdate({trigger: trigger,  fetchedData: fetchedData, nodes: nodes, edges: edges, onDetailClick: onDetailClick})
                    setNodes(nextNodes);
                    setEdges(nextEdges);
                    setCenter(centerX ?? 0, centerY ?? 0, { zoom: 1.2, duration: 800 })
                }
            }
        }
        focusOnNode()
    }, [currentIndex, results, getNodes, setCenter, getEdges, setNodes, setEdges, onDetailClick]);

    const nextResult = () => {
        if (currentIndex < results.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const prevResult = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    return { 
        query, 
        setQuery, 
        isLoading, 
        results, 
        currentIndex, 
        hasSearched,
        handleSearch, 
        nextResult, 
        prevResult 
    };
}