import type { Pessoa } from "./Responses";

export interface PersonEditForm {
    nome: string;
    sexo: string;
    biografia: string;
    dataNascimento: string;
    dataFalecimento: string;
    father: Pessoa | null;
    mother: Pessoa | null;
    conjuge: Pessoa | null;
    married: boolean;
}

export interface PersonEditProps {
    id: string;
    person: Pessoa;
    parents: {
        father: Pessoa | null;
        mother: Pessoa | null;
        married: boolean;
    };
    conjuge: Pessoa | null;
    onSubmit: (arg1: PersonEditForm, arg2: File | null, arg3: boolean) => void;
    onCancel: () => void;
} 
