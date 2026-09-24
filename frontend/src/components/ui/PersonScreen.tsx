import { RoundButton } from '../basic/RoundButton';
import { DeleteModal } from '../major/DeleteModal';
import { PersonEdit } from '../major/PersonEdit';
import { PersonNode } from '../major/PersonNode';
import Back from '../../assets/back.svg?react';
import './PersonScreen.css';
import { usePersonEditor } from '../../hooks/usePersonEditor';
import type { RefreshTrigger } from '../../types/refreshTrigger';

interface PersonScreenProps {
    personId: string;
    onClose: () => void;
    onSuccessSave: (arg1: RefreshTrigger) => void;
}

export function PersonScreen({personId, onClose, onSuccessSave}: PersonScreenProps) {
    
    const { 
        person,
        isEditing, 
        isDeleteModalOpen,
        feedback, 
        handleEditClick, 
        handleCancel, 
        handleSubmit, 
        handleDelete,
        handleClose ,
        handleConfirmDelete,
        deleteStatus
    } = usePersonEditor(personId, onSuccessSave, onClose);

    return (
        <div className="person-details-screen">
            
            <RoundButton onClick={handleClose}>
                <Back />
            </RoundButton>
            
            <div className="person-content-wrapper">
                {feedback.type && (
                    <div className={`feedback-banner ${feedback.type}`}>
                        {feedback.text}
                    </div>
                )}

                {isEditing && person ? (
                    <PersonEdit 
                        id={personId}
                        person={person.person}
                        parents={person.parents}
                        conjuge={person.conjuge}
                        onCancel={handleCancel} 
                        onSubmit={handleSubmit} 
                    />
                ) : (
                    person && (
                        <PersonNode
                            person={person.person}
                            onEdit={handleEditClick} 
                            onDeleteRequest={handleDelete}
                        />
                    )
                )}

                {person && isDeleteModalOpen && (
                    <DeleteModal
                        personName={person.person.nome}
                        status={deleteStatus}
                        onConfirm={handleConfirmDelete}
                        onCancel={handleCancel}
                    />
                )}
            </div>
            
        </div>
    );
}