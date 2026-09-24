import { Img } from '../basic/Img';
import { Position, Handle } from '@xyflow/react';
import './MiniCard.css';
import Eye from '../../assets/eye.svg?react';
import { useMemo } from 'react';

interface MiniCardProps {
    data: {
        nome:string;
        right:boolean;
        onClick: (e: React.MouseEvent, id: string) => void;
        imgUrl: string;
    },
    id: string;
}

export function MiniCard(props : MiniCardProps) {
    const {nome, right, onClick, imgUrl} = props.data;
    const id = props.id

    const imageSrc = useMemo(() => {
        if (!imgUrl) return '/noPhoto.png';
        return `${import.meta.env.VITE_API_URL}${imgUrl}?t=${new Date().getTime()}`;
    }, [imgUrl]);

    return (
        <div className="card">

            <button className="eye-button" onClick={e => onClick(e, id)} data-tooltip="Detalhes da pessoa">
                <Eye className="eye-icon" fill="black"/>
            </button>

            <Img src={imageSrc} alt='pessoa' height='60%'></Img>
            <h3>{nome}</h3>
            <Handle style={{border: 'none', background: 'none'}} id='relationship' type='source' position={right ? Position.Right : Position.Left}/>
            <Handle style={{border: 'none', background: 'none'}} id='weeding' type='target' position={right ? Position.Right : Position.Left}></Handle>
            <Handle style={{border: 'none', background: 'none'}} id='parentship' type='target' position={Position.Top}/>
            <Handle style={{border: 'none', background: 'none'}} id='single' type='source' position={Position.Bottom}></Handle>
        </div>
    )
}