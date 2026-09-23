import { type RelativesResponse } from '../types/Responses';

export async function fetchPersonWithFamily(personId: string): Promise<Record<string, RelativesResponse>> {
  try {
      // 1. Busca a pessoa focal primeiro
      const mainRes = await fetch(`${import.meta.env.VITE_API_URL}/people/${personId}/relatives`, {
        credentials: 'include'
      })
      if(!mainRes.ok){
        throw new Error("Não foi possível buscar a pessoa");
      }
      const mainData = await mainRes.json();
      const fetchedMap: Record<string, RelativesResponse> = { [personId]: mainData };
    
      // 2. Coleta todos os IDs relacionados que precisam ser buscados
      const relatedIds = [
        mainData.parents.father?.id,
        mainData.parents.mother?.id,
        mainData.conjuge?.id,
        ...(mainData.children || []).map(c => c.id)
      ].filter(Boolean) as string[];
    
      // 3. Dispara as buscas dos parentes em paralelo
      const relatedResults : RelativesResponse[] = await Promise.all(
        relatedIds.map(id => fetch(`${import.meta.env.VITE_API_URL}/people/${id}/relatives`, {credentials: 'include'}).then(res => res.json()))
      );
    
      // 4. Popula o dicionário centralizado (fetchedData)
      relatedResults.forEach(data => {
        fetchedMap[data.person.id] = data;
      });
    
      return fetchedMap;
  } catch (error) {
    return {}
  }
}

export async function fetchPerson(personId: string): Promise<Record<string, RelativesResponse> | null> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/people/${personId}/relatives`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Não foi possível buscar a pessoa');
    }
    const res = await response.json() as RelativesResponse;
    return {[personId] : res};
  } catch (error) {
    return null;
  }
}