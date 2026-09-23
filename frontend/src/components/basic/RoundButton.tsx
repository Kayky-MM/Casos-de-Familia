import './RoundButton.css'

export function RoundButton({onClick, children}) {

    return (
        <button className='round-btn' onClick={onClick}>
            {children}
        </button>
    )
}