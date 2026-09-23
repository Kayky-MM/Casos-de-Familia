import { validatePersonForm } from "../utils/validationForm";
import { uploadAvatar } from "./usePersonEditor";

interface FormData {
    username: string;
    password: string;
}

const url = import.meta.env.VITE_API_URL

export function useSetupAccount(){

    const handleCreateProfile = async (formData:FormData, personData: any, avatarFile: File | null ) => {
        const {valid, msg} = validatePersonForm(personData);
        if(!valid){
            return {success: false, personId: null, msg}
        }
        try {
            const res = await fetch(`${url}/user/setup`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({...formData, person: {...personData, 
                    fatherName: personData?.father?.nome,
                    motherName: personData?.mother?.nome,
                    conjugeName: personData?.conjuge?.nome}
                })
            })
            if(!res.ok){
                throw new Error(res.statusText)
            }
            const data = await res.json()

            await uploadAvatar(Number(data.idPessoa), avatarFile, false);

            return {success: true, personId: data.idPessoa, msg: "Requisição feita"};
        } catch (error) {
            return {success: false, personId: null, msg: error?.message || ''};
        }
    }

    return [handleCreateProfile]
}