import type { Pessoa } from "../types/Responses";

export function validatePersonForm({nome, dataNascimento, dataFalecimento }: Pick<Pessoa, "nome" | "dataNascimento" | "dataFalecimento">){
    if(!nome || nome.trim() === ''){
        return {valid: false, msg: "O nome não pode ser vazio"}
    }
    if((dataNascimento && dataFalecimento) && (dataNascimento > dataFalecimento)){
        return {valid: false, msg: "Data de nascimento deve ser menor que a data de falecimento"}
    }
    return {valid: true, msg: "Dados válidos"}
}