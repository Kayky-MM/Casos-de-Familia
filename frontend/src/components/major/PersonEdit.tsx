import { useState } from 'react';
import { Img } from '../basic/Img';
import Ellipsis from '../../assets/ellipsisVertical.svg?react';
import './PersonNode.css'; 
import './PersonEdit.css';
import { useSearch } from '../../hooks/useSearch';
import { SearchModal } from './SearchModal';
import { RelationSlot } from '../basic/RelationSlot';
import type { PersonEditForm, PersonEditProps } from '../../types/PersonEdit';
import type { Pessoa } from '../../types/Responses';

export function PersonEdit(props: PersonEditProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { isSearchOpen, searchQuery, searchResults, targetRelation, openSearch, closeSearch, handleSearch } = useSearch();
    const {sexo, nome, biografia, dataNascimento, dataFalecimento} = props.person;
    const {parents, conjuge} = props;
    
    const isNew = props.id === 'new' || props.id === 'new-user';

    const [formData, setFormData] = useState<PersonEditForm>({
        nome: nome || '',
        sexo: sexo || 'M',
        biografia: biografia || '',
        dataNascimento: dataNascimento ? new Date(dataNascimento).toISOString().split('T')[0] : '',
        dataFalecimento: dataFalecimento ? new Date(dataFalecimento).toISOString().split('T')[0] : '',
        father: parents?.father || null,
        mother: parents?.mother || null,
        conjuge: conjuge || null,
        married: parents?.married || false 
    });

    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>(
        props.person?.avatarUrl ? `${import.meta.env.VITE_API_URL}${props.person.avatarUrl}?t=${new Date().getTime()}` : '/noPhoto.png'
    );
    const [deleteFile, setDeleteFile] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, married: e.target.checked });
    };

    const handleManualRelationChange = (relation: 'father' | 'mother' | 'conjuge', newName: string) => {
        setFormData({
            ...formData,
            [relation]: { id: null, nome: newName }
        });
    };

    const onSelectRelation = (personSelected: Pessoa) => {
        if (targetRelation) {
            setFormData({ ...formData, [targetRelation]: personSelected });
        }
        closeSearch();
    };

    // Função para anular uma relação no estado, indicando ao backend que ela foi cortada
    const handleCutRelation = (relation: 'father' | 'mother' | 'conjuge') => {
        setFormData({
            ...formData,
            [relation]: null
        });
    };

    const handleAvatarFileChange = (file: File | null, deleteFile?: boolean) => {
        if(deleteFile){
            setSelectedAvatarFile(null);
            setAvatarPreview('/noPhoto.png');
            setDeleteFile(true);
        }
        if (!file) return;

        setSelectedAvatarFile(file);
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
        setDeleteFile(false);
    };

    const handleSubmit = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if(isLoading) return;
        setIsLoading(true);
        await props.onSubmit(formData, selectedAvatarFile, deleteFile);
        setIsLoading(false);
    };

    return (
        <div className="card-edit-wrapper">
            
            <div className="card expanded editing">
                <header>
                    {isNew ? (
                        <select className='select-sexo' name="sexo" id="sexo" onChange={handleChange} value={formData.sexo}>
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                        </select>
                    ) : (
                        <span>{sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
                    )}
                    
                    <div className="menu-container">
                        <div className="icon"><Ellipsis /></div>
                        <div className="action-menu">
                            <button disabled={isLoading} onClick={handleSubmit}>{isNew ? (props.id === 'new-user') ? 'Criar' : 'Adicionar' : 'Salvar'}</button>
                            <button className="danger" onClick={(e) => { e.stopPropagation(); props.onCancel(); }}>Cancelar</button>
                        </div>
                    </div>
                </header>
                
                <Img
                    src={avatarPreview}
                    alt='pessoa'
                    height='40%'
                    isUpdate={true}
                    onFileChange={handleAvatarFileChange}
                />
                
                <input className="edit-input name-input" name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome da pessoa" autoComplete='off'/>
                <textarea className="edit-input bio-input" name="biografia" value={formData.biografia} onChange={handleChange} placeholder="Escreva uma biografia..." />
                
                <footer>
                    <div className="date-group">
                        <label>Nasc:</label>
                        <input type="date" name="dataNascimento" className="edit-input" value={formData.dataNascimento} onChange={handleChange} />
                    </div>
                    {props.id !== 'new-user' && <div className="date-group">
                        <label>Fal:</label>
                        <input type="date" name="dataFalecimento" className="edit-input" value={formData.dataFalecimento} onChange={handleChange} />
                    </div>}
                </footer>
            </div>

            <div className="card expanded editing">
                <SearchModal 
                    isOpen={isSearchOpen} query={searchQuery} results={searchResults}
                    onSearch={handleSearch} onSelect={onSelectRelation} onClose={closeSearch}
                />
                
                <div className="relations-edit-grid">
                    <RelationSlot
                        label="Pai"
                        relation="father"
                        isNew={isNew}
                        personId={props.id}
                        relationData={formData.father}
                        placeholderText="Nome do Pai..."
                        onManualChange={handleManualRelationChange}
                        onOpenSearch={openSearch}
                        onCutRelation={handleCutRelation}
                    />

                    <RelationSlot
                        label="Mãe"
                        relation="mother"
                        isNew={isNew}
                        personId={props.id}
                        relationData={formData.mother}
                        placeholderText="Nome da Mãe..."
                        onManualChange={handleManualRelationChange}
                        onOpenSearch={openSearch}
                        onCutRelation={handleCutRelation}
                    />

                    {/* --- CHECKBOX DE CASAMENTO (Só no modo Adicionar) --- */}
                    {isNew && (
                        <div className="married-checkbox">
                            <label>
                                <input type="checkbox" checked={formData.married} onChange={handleCheckboxChange} />
                                Os pais são casados?
                            </label>
                        </div>
                    )}

                    <RelationSlot
                        label="Cônjuge"
                        relation="conjuge"
                        isNew={isNew}
                        personId={props.id}
                        relationData={formData.conjuge}
                        placeholderText="Nome do Cônjuge..."
                        onManualChange={handleManualRelationChange}
                        onOpenSearch={openSearch}
                        onCutRelation={handleCutRelation}
                    />
                </div>
            </div>

        </div>
    );
}