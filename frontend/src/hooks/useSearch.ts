import { useState } from 'react';

const url = import.meta.env.VITE_API_URL; // Ajuste conforme seu .env no futuro

export function useSearch() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [targetRelation, setTargetRelation] = useState<'father' | 'mother' | 'conjuge' | null>(null);

    // Abre o modal informando quem estamos buscando (pai, mãe ou cônjuge)
    const openSearch = (relation: 'father' | 'mother' | 'conjuge') => {
        setTargetRelation(relation);
        setSearchQuery('');
        setSearchResults([]);
        setIsSearchOpen(true);
    };

    const closeSearch = () => {
        setIsSearchOpen(false);
        setTargetRelation(null);
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        
        // Só busca se tiver mais de 2 letras para poupar o banco de dados
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            let genderFilter = '';
        if (targetRelation === 'father') genderFilter = '&sexo=M';
        if (targetRelation === 'mother') genderFilter = '&sexo=F';

            const response = await fetch(`${url}/people?search=${query}${genderFilter}`, {
                credentials: "include"
            });
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (error) {
            return;
        }
    };

    return {
        isSearchOpen,
        searchQuery,
        searchResults,
        targetRelation,
        openSearch,
        closeSearch,
        handleSearch
    };
}