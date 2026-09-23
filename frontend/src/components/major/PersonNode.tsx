import { Img } from '../basic/Img';
import './PersonNode.css';
import { formatarData } from '../../utils/dateFormatter';
import Ellipsis from '../../assets/ellipsisVertical.svg?react';
import { useState } from 'react';
import { type RelativesResponse } from '../../types/Responses';

interface PersonProps {
    onEdit: () => void;
    onDeleteRequest: () => void; 
}

const API_URL = import.meta.env.VITE_API_URL 
export function PersonNode(props: RelativesResponse & PersonProps){
    const { onEdit, onDeleteRequest} = props
    const {sexo, nome, biografia, dataNascimento, dataFalecimento, avatarUrl} = props.person
    const [menuAberta, setMenuAberta] = useState(false);
    const avatarSrc = avatarUrl ? `${API_URL}${avatarUrl}?t=${new Date().getTime()}` : '/noPhoto.png';
    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        setMenuAberta(!menuAberta);
    };
    return (
        <div className="card expanded">
            <header>
                <span>{(sexo === 'M') ? "Masculino" : "Feminino"}</span>
                <div className="menu-container">
                    <div className="icon" onClick={toggleMenu}>
                        <Ellipsis />
                    </div>

                    {menuAberta && (
                        <div className="action-menu">
                            <button onClick={onEdit}>
                                Editar
                            </button>
                            <button className="danger" onClick={(e) => { e.stopPropagation(); setMenuAberta(false); onDeleteRequest(); }}>
                                Excluir
                            </button>
                        </div>
                    )}
                </div>
            </header>
            <Img src={avatarSrc} alt='pessoa' height='40%' />
            <h3>{nome}</h3>
            <p className="bio">
                {biografia || 'Sem biografia.'}
            </p>
            <footer><span>Nasc: {formatarData(dataNascimento) || '--/--/----'}</span> <span>Fal: {formatarData(dataFalecimento) || '--/--/----'}</span></footer>
        </div>
    )
}