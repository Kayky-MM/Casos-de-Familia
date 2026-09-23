import './DeleteModal.css';

interface DeleteModalProps {
    personName: string;
    status: 'idle' | 'loading' | 'success';
    onConfirm: () => void;
    onCancel: () => void;
}

export function DeleteModal({ personName, status, onConfirm, onCancel }: DeleteModalProps) {

    return (
        <div className="delete-overlay">
            <div className="delete-card">
                {status === 'idle' && (
                    <>
                        <h3>Tem certeza que deseja excluir {personName}?</h3>
                        <div className="delete-actions">
                            <button onClick={onCancel}>Cancelar</button>
                            <button className="danger" onClick={onConfirm}>Confirmar</button>
                        </div>
                    </>
                )}
                
                {status === 'loading' && (
                    <h3>Excluindo...</h3>
                )}
                
                {status === 'success' && (
                    <h3 className="success-text">{personName} excluído com sucesso!</h3>
                )}
            </div>
        </div>
    );
}