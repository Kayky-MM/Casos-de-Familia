import './SearchModal.css';

interface SearchModalProps {
    isOpen: boolean;
    query: string;
    results: any[];
    onClose: () => void;
    onSearch: (text: string) => void;
    onSelect: (person: any) => void;
}

export function SearchModal({ isOpen, query, results, onClose, onSearch, onSelect }: SearchModalProps) {
    if (!isOpen) return null;

    return (
        <div className="search-modal-overlay" onClick={onClose}>

            <div className="search-modal-content" onClick={e => e.stopPropagation()}>
                
                <header>
                    <h4>Buscar Pessoa</h4>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </header>

                <input 
                    type="text" 
                    placeholder="Digite o nome..." 
                    value={query}
                    onChange={(e) => onSearch(e.target.value)}
                    autoFocus
                />

                <div className="search-results-list">
                    {results.length > 0 ? (
    results.map(person => (
        <div key={person.id} className="search-result-item" onClick={() => onSelect(person)}>
            <img src="/noPhoto.png" alt="Foto" />
            <span>{person.nome}</span>
        </div>
    ))
) : (
    query.length >= 2 && <p className="no-results">Nenhuma pessoa encontrada.</p>
)}
                </div>

            </div>
        </div>
    );
}