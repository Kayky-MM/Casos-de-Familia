import type { ReactElement } from 'react';
import './RoundButton.css'

interface roundBtnProps {
    onClick: (e: React.MouseEvent) => void;
    children: ReactElement;
}

export function RoundButton({onClick, children}:roundBtnProps ) {

    return (
        <button className='round-btn' onClick={onClick}>
            {children}
        </button>
    )
}