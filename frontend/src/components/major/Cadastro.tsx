import { useState } from 'react';
import Eye from '../../assets/eye.svg?react';
import EyeOff from '../../assets/eyeOff.svg?react';
import './Cadastro.css';

interface CadastroProps {
    mode: 'login' | 'setup';
    onSubmit: (data: any) => void;
}

export function Cadastro({ mode, onSubmit }: CadastroProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(isLoading) return;
        setIsLoading(true);
        await onSubmit(formData);
        setIsLoading(false);
    };

    return (
        <form className="cadastro-form" onSubmit={handleSubmit}>
            <h2>{mode === 'setup' ? "Criar Conta" : "Acessar árvore"}</h2>
            <p>Bem-vindo! {mode === 'setup' ? "Para começar sua árvore, crie seu acesso." : "Para entrar, digite seu usuário e senha"}</p>

                <div className="input-group">
                    <label htmlFor="username">Nome de usuário</label>
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        value={formData.username} 
                        onChange={handleChange} 
                        autoComplete='on'
                        placeholder="Seu nome de usuário"
                        required 
                    />
                </div>
            
            <div className="input-group">
                <label htmlFor="password">Senha</label>
                <input 
                    type={showPassword ? 'text' : 'password'}
                    id="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="Sua senha"
                    required 
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className='toggle-password-btn'
                >
                    {showPassword ? <EyeOff size={40} /> : <Eye size={40} />}
                </button>
            </div>
            
            <button type="submit" className="submit-btn" disabled={isLoading}>
                {mode === 'setup' ? (
                    isLoading ? 'Carregando' : 'Criar árvore'
                ): (
                    isLoading ? 'Carregando' : 'Acessar'
                )}
            </button>
        </form>
    );
}