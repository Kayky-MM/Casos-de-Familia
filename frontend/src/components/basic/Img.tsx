import type React from 'react';
import type { ImgProps } from '../../types/ImgProps'
import './Img.css'

export function Img(props: ImgProps) {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        props.onFileChange?.(file);
        event.target.value = '';
    };

    const handleFileDelete = (event: React.MouseEvent) => {
        props.onFileChange?.(null, true);
    }

    return (
        <div className="img-wrapper" style={{ height: props.height }}>
            <img src={props.src || './noPhoto.png'} alt={props.alt} />

            {props.isUpdate && (<>
                <label className="image-upload-label">
                    <input type="file" accept="image/png,image/jpeg" onChange={handleFileChange} />
                    <span>Escolher imagem</span>
                </label>
                <button className='image-remove-btn' onClick={handleFileDelete}> Deletar Imagem</button>
            </>
            )}
        </div>
    )
}