import { useEffect, useState } from "react";
import type { RelativesResponse } from "../types/Responses";

const reset : RelativesResponse = {person: {id: 0, sexo: "M", nome: '', biografia: '', dataNascimento: null, dataFalecimento: null},
    parents : {father: null, mother: null, married: false}, 
    conjuge: null,
    children: []
}

export function usePerson(userId: number){
    const [person, setPerson] = useState<RelativesResponse>(reset)

    useEffect(()=> {
        async function getPerson(){
            if(isNaN(userId)){
                setPerson(reset)
                return;
            }
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/people/${userId}/relatives`, {
                    credentials: "include"
                });
                const person : RelativesResponse = await res.json();
                setPerson({
                    ...person
                })
            } catch (error) {
                return;
            }
        }
        getPerson()
    }, [userId, setPerson])

    return {person, setPerson}
}