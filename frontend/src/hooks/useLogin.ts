import { useNavigate } from "react-router-dom";

interface FormData {
    username: string;
    password: string;
}

export function useLogin(){
    const navigate = useNavigate();

    const handleLoginSubmit = async (credentials: FormData) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/user/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...credentials
                })
            })
            if(!res.ok){
                throw new Error(res.statusText)
            }
            const data = await res.json()
            if(data?.user?.idPessoa){
                navigate(`/tree/${data.user.idPessoa}`)
            }else{
                throw new Error("Nenhum id válido", data)
            }
        } catch (error) {
            return;
        }
    };

    const handleCadastro = () => navigate('/setup');

    return {handleLoginSubmit, handleCadastro}
}