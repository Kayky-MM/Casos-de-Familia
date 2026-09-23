import { useEffect, useState } from "react";

export function useFindUser(){
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [exists, setExists] = useState<boolean | null>(false);

    useEffect(()=> {
        async function findUser(){
            setIsLoading(true)
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/user/any`)
                const data : {exists: boolean} = await res.json()
                setExists(data.exists)
            } catch (error) {
                setExists(null);
            } finally {
                setIsLoading(false);
            }
        }
        findUser()
    }, [])

    return [isLoading, exists]
}