import { useState } from 'react';
import { useFindUser } from '../hooks/useFindUser';
import { Cadastro } from '../components/major/Cadastro';
import './HomePage.css';
import { useLogin } from '../hooks/useLogin';
// colocar handle de carregamento e erro no login
// colocar estilo no erro
export function HomePage(){
    const [isLoading, exists] = useFindUser();
    
    const [showLogin, setShowLogin] = useState(false);

    const {handleLoginSubmit, handleCadastro} = useLogin();

    return (
        <div className="home-screen">
            <h1>Casos de Família</h1>
            {isLoading ? (
                <div className="loading-info">
                    Carregando...
                </div>
            ): 
            (exists === null ? (
                <div>Ocorreu um erro ao iniciar o App. Verifique o log de erro</div>
            ) :
            exists ? (
                <div className="login-section">
                    {!showLogin && (
                        <button className='home-page-btn' onClick={() => setShowLogin(true)}>Entrar</button>
                    )}
                    
                    {showLogin && (
                        <Cadastro mode="login" onSubmit={handleLoginSubmit} />
                    )}
                </div>
            ): (
                <button className='home-page-btn' onClick={handleCadastro}>Cadastrar</button>
            ))}
        </div>
    )
}