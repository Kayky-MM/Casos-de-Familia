import { useGraphSearch } from '../../hooks/useGraphSearch';
import MagniGlass from '../../assets/magniGlass.svg?react';
import ChevRight from '../../assets/chevRight.svg?react';
import ChevLeft from '../../assets/chevLeft.svg?react';
import './GraphSearchBar.css';

export function GraphSearchBar({onDetailClick}) {
    const { 
        query, setQuery, isLoading, results, currentIndex, hasSearched,
        handleSearch, nextResult, prevResult 
    } = useGraphSearch(onDetailClick);

    return (
        <div className="graph-search-container">
            <div className="search-input-group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar na árvore..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button type="button" className="search-btn" onClick={handleSearch} disabled={isLoading}>
                    <MagniGlass stroke="black"/>
                </button>
            </div>
            
            {/* Feedback de carregamento */}
            {isLoading && (
                <div className="search-feedback">
                    <span className="spinner"></span> Buscando...
                </div>
            )}

            {/* Feedback de "Nenhum resultado" */}
            {!isLoading && hasSearched && results.length === 0 && (
                <div className="search-feedback empty-state">
                    Nenhuma pessoa encontrada.
                </div>
            )}

            {/* Navegação da Câmera */}
            {!isLoading && results.length > 0 && (
                <div className="search-navigation">
                    <button 
                    className='search-nav-btn'
                        onClick={prevResult} 
                        disabled={currentIndex <= 0}
                    >
                        <ChevLeft stroke="black"/>
                    </button>
                    
                    <span>{currentIndex + 1} de {results.length}</span>
                    
                    <button 
                    className='search-nav-btn'
                        onClick={nextResult} 
                        disabled={currentIndex >= results.length - 1}
                    >
                        <ChevRight stroke="black"/>
                    </button>
                </div>
            )}
        </div>
    );
}