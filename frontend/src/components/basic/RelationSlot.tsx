import { useState } from 'react';
import './RelationSlot.css';

interface RelationSlotProps {
    label: string;
    relation: 'father' | 'mother' | 'conjuge';
    isNew: boolean;
    personId: string;
    relationData: { id: number | null; nome: string } | null;
    placeholderText: string;
    onManualChange: (relation: 'father' | 'mother' | 'conjuge', newName: string) => void;
    onOpenSearch: (relation: 'father' | 'mother' | 'conjuge') => void;
    onCutRelation: (relation: 'father' | 'mother' | 'conjuge') => void;
}

export function RelationSlot({
    label,
    relation,
    isNew,
    personId,
    relationData,
    placeholderText,
    onManualChange,
    onOpenSearch,
    onCutRelation
}: RelationSlotProps) {
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(relationData?.nome || '');

    const handleSaveName = () => {
        onManualChange(relation, tempName);
        setIsEditingName(false);
    };

    const handleCancelEdit = () => {
        setTempName(relationData?.nome || '');
        setIsEditingName(false);
    };

    return (
        <div className="relation-slot">
            <small>{label}:</small>
            {isNew ? (
                isEditingName ? (
                    <div className="relation-input-group">
                        <input 
                            type="text" 
                            className="edit-input-slot" 
                            placeholder={placeholderText}
                            value={tempName}
                            autoComplete='off'
                            onChange={(e) => setTempName(e.target.value)}
                        />
                        <div className="relation-action-buttons">
                        <button className='edit-input-btn' type="button" onClick={handleSaveName}>Salvar</button>
                        <button className='edit-input-btn danger' type="button" onClick={handleCancelEdit}>Cancelar</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <span className="relation-name">{relationData?.nome || 'Nenhum(a)'}</span>
                        <div className="relation-action-buttons">
                            <button type="button" onClick={() => setIsEditingName(true)}>Novo nome</button>
                            {personId !== 'new-user' && (
                                <button type="button" onClick={() => onOpenSearch(relation)}>Buscar nome</button>
                            )}
                        </div>
                    </>
                )
            ) : (
                <>
                    <span className="relation-name">{relationData?.nome || 'Nenhum(a)'}</span>
                    <div className="relation-action-buttons">
                        <button type="button" onClick={() => onOpenSearch(relation)}>Mudar</button>
                        {relationData && (
                            <button type="button" className="danger" onClick={() => onCutRelation(relation)}>Cortar</button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
