export interface Pessoa {
    id: number;
    nome: string;
    sexo: 'M' | 'F';
    biografia: string | null;
    dataNascimento: Date | null;
    dataFalecimento: Date | null;
    avatarUrl?: string | null;
}

export interface RelativesResponse {
    person: Pessoa;
    parents: {
        father: Pessoa | null;
        mother: Pessoa | null;
        married: boolean;
    };
    conjuge: Pessoa | null;
    children: Pessoa[];
}

export type UpdateResponse = RelativesResponse & {
    removedFatherId: number | null;
    removedMotherId: number | null;
    removedConjugeId: number | null;
}