import { useState, useEffect } from 'react';
import type { RelativesResponse, UpdateResponse } from '../types/Responses';
import type { RefreshTrigger } from '../types/refreshTrigger';
import { usePerson } from './usePerson';
import { validatePersonForm } from '../utils/validationForm';

const url = import.meta.env.VITE_API_URL;

export async function uploadAvatar(personId: number, file: File | null, deleteFile? : boolean) {
    if(deleteFile){
        const response = await fetch(`${url}/people/${personId}/avatar`, {
        method: 'DELETE',
        credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Erro ao enviar a imagem.');

        }
        return {}
    }
    if(!file){
        return {}
    }
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${url}/people/${personId}/avatar`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Erro ao enviar a imagem.');
    }

    return response.json();
}

export function usePersonEditor(personId: number | 'new' | null, onPersonUpdate: (arg1: RefreshTrigger) => void, onClickClose: () => void) {
    const isNew = personId === 'new';
    const {person, setPerson} = usePerson(Number(personId));
    
    const [isEditing, setIsEditing] = useState(isNew);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [feedback, setFeedback] = useState<{ text: string; type: 'info' | 'success' | 'error' | 'add' | null }>({
        text: isNew ? 'Adicione as informações da nova pessoa e seus parentes.' : '',
        type: isNew ? 'add' : null
    });

    const [deleteStatus, setDeleteStatus] = useState<'idle' | 'loading' | 'success'>('idle')

    useEffect(() => {
        const isPersonNew = personId === 'new';
        setIsEditing(isPersonNew);
        setFeedback({
            text: isPersonNew ? 'Adicione as informações da nova pessoa e seus parentes.' : '',
            type: isPersonNew ? 'add' : null
        });
    }, [personId]);

    const handleEditClick = () => {
        setIsEditing(true);
        setFeedback({ text: 'Modo de edição ativado. Altere os dados abaixo.', type: 'info' });
    };

    const handleCancel = (e?: React.MouseEvent) => {
        // 2. Se cancelar a criação de uma pessoa NOVA, fecha a tela inteira
        if (isNew) {
            if (onClickClose) onClickClose(e);
        } else {
            setIsEditing(false);
            setIsDeleteModalOpen(false);
            setFeedback({ text: '', type: null });
        }
    };

    const handleClose = (e: React.MouseEvent) => {
        setIsEditing(false);
        setFeedback({ text: '', type: null });
        if (onClickClose) onClickClose(e);
    };

    const handleSave = async (updatedData: any, imageFile?: File | null, deleteFile?: boolean) => {
        setFeedback({ text: 'Salvando...', type: 'info' });
        const {valid, msg} = validatePersonForm(updatedData);
        if(!valid){
            setFeedback({text: msg, type: 'error'});
            return;
        }
        try {
            
            const response = await fetch(`${url}/people/${personId}`, {
                method: 'PATCH', 
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    nome: updatedData.nome,
                    biografia: updatedData.biografia,
                    dataNascimento: updatedData.dataNascimento ? new Date(updatedData.dataNascimento).toISOString() : null,
                    dataFalecimento: updatedData.dataFalecimento ? new Date(updatedData.dataFalecimento).toISOString() : null,
                    fatherId: updatedData.father?.id || null,
                    motherId: updatedData.mother?.id || null,
                    conjugeId: updatedData.conjuge?.id || null
                })
            });

            if (!response.ok) {
                if(response.status >= 400 && response.status < 500){
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Erro na requisição");
                }
                throw new Error('Erro na requisição')
            }
            
            const data: UpdateResponse = await response.json();
            
            const {avatarUrl} = await uploadAvatar(Number(personId), imageFile, deleteFile);

            data.person.avatarUrl = deleteFile
                ? null
                : avatarUrl !== undefined
                    ? avatarUrl
                    : person.person.avatarUrl;

            const relationId = (relation: { id?: number } | null | undefined) =>
            relation?.id ?? null;

            const relationsChanged =
                relationId(person.parents.father) !== relationId(updatedData.father) ||
                relationId(person.parents.mother) !== relationId(updatedData.mother) ||
                relationId(person.conjuge) !== relationId(updatedData.conjuge);

            
            onPersonUpdate({
                trigger: 'update',
                personId: String(data.person.id),
                relationsChanged,
                removedConjugeId: data.removedConjugeId != null ? String(data.removedConjugeId) : null,
                removedFatherId: data.removedFatherId != null ? String(data.removedFatherId) : null,
                removedMotherId: data.removedMotherId != null ? String(data.removedMotherId) : null
            });
            
            setFeedback({ text: 'Dados atualizados com sucesso!', type: 'success' });
            setPerson({...data})
            setIsEditing(false);
            
            setTimeout(() => setFeedback({ text: '', type: null }), 3000);
            
        } catch (error) {
            const message = error instanceof Error ? `Erro ao salvar pessoa: ${error.message}` : 'Erro ao salvar pessoa. Tente novamente.';
            setFeedback({ text: message, type: 'error' });
        }
    };

    const handleAdd = async (addData: any, imageFile?: File | null) => {
        setFeedback({ text: 'Adicionando...', type: 'info' });
        const {valid, msg} = validatePersonForm(addData);
        if(!valid){
            setFeedback({text: msg, type: 'error'});
            return;
        }
        try {
            
            const relationshipsPayload = {
                fatherId: addData.father?.id || null,
                motherId: addData.mother?.id || null,
                conjugeId: addData.conjuge?.id || null,
                fatherData: addData.father?.nome && !addData.father?.id ? { nome: addData.father.nome } : null,
                motherData: addData.mother?.nome && !addData.mother?.id ? { nome: addData.mother.nome } : null,
                conjugeData: addData.conjuge?.nome && !addData.conjuge?.id ? { nome: addData.conjuge.nome } : null,
            };

            const response = await fetch(`${url}/people`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    nome: addData.nome,
                    sexo: addData.sexo,
                    biografia: addData.biografia,
                    dataNascimento: addData.dataNascimento ? new Date(addData.dataNascimento).toISOString() : null,
                    dataFalecimento: addData.dataFalecimento ? new Date(addData.dataFalecimento).toISOString() : null,
                    relationships: relationshipsPayload,
                    married: addData.married || false
                })
            });

            if (!response.ok) {
                if(response.status >= 400 && response.status < 500){
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Erro na requisição");
                }
                throw new Error('Erro na requisição')
            }

            const data: RelativesResponse = await response.json();

            if (imageFile && data.person.id) {
                const {avatarUrl} = await uploadAvatar(Number(data.person.id), imageFile, false);
                data.person.avatarUrl = avatarUrl || null;
            }
            setPerson({...data});
            onPersonUpdate({
                trigger: 'add',
                relationsChanged: false,
                personId: String(data.person.id)
            });
            setFeedback({ text: 'Dados inseridos com sucesso!', type: 'success' });
            setIsEditing(false);
            
            setTimeout(() => {
                setFeedback({ text: '', type: null });
            }, 3000);
            
        } catch (error) {
            const message = error instanceof Error ? `Erro ao adicionar pessoa: ${error.message}` : 'Erro ao adicionar pessoa. Tente novamente.';
            setFeedback({ text: message, type: 'error' });
        }
    }

    const handleConfirmDelete = async () => {
        setFeedback({text: 'Removendo...', type: 'info'});
        setDeleteStatus('loading')
        
        try {
            const response = await fetch(`${url}/people/${personId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                if(response.status >= 400 && response.status < 500){
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Erro na requisição");
                }
                throw new Error('Erro na requisição')
            }

            setDeleteStatus('success')
            onPersonUpdate({trigger: 'delete', personId: String(personId)})
            setTimeout(() => {
                onClickClose();
            }, 3000);

        } catch (error) {
            setDeleteStatus('idle')
            setIsDeleteModalOpen(false);
            const message = error instanceof Error ? `Erro ao deletar pessoa: ${error.message}` : 'Erro ao deletar pessoa. Tente novamente.';
            setFeedback({ text: message, type: 'error' });
            setTimeout(() => setFeedback({text: '', type: null}), 3000);
        }
    };

    const handleDelete = () => setIsDeleteModalOpen(true)

    return {
        person,
        isEditing,
        isDeleteModalOpen,
        feedback,
        handleEditClick,
        handleCancel,
        handleSubmit: (isNew ? handleAdd : handleSave),
        handleDelete,
        handleClose,
        handleConfirmDelete,
        deleteStatus
    };
}