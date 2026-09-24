import { useState } from 'react';
import Back from '../assets/back.svg?react';
import { PersonEdit } from '../components/major/PersonEdit';
import { useSetupAccount } from '../hooks/useSetupAccount';
import './Setup.css';
import { useNavigate } from 'react-router-dom';
import { Cadastro } from '../components/major/Cadastro';
import { RoundButton } from '../components/basic/RoundButton';
import { nullPerson } from '../types/Responses';
import type { PersonEditForm } from '../types/PersonEdit';

export function Setup() {
    const [step, setStep] = useState<1 | 2>(1);
    const navigate = useNavigate();
    
    const [accountData, setAccountData] = useState({ username: '', password: '' });
    
    const [ handleCreateProfile ] = useSetupAccount();

    const onNextStep = async (formData: {username: string, password: string}) => {
        setAccountData(formData)
        setStep(2);
    };

    const onFinishSetup = async (personFormData: PersonEditForm, avatarFile: File | null) => {
        const {success, personId, msg} = await handleCreateProfile(accountData, personFormData, avatarFile);
        if(success && personId){
            navigate(`/tree/${personId}`)
        }else{
            alert(`Erro ao criar conta. ${msg}`);
            setStep(1);
        }
    };

    return (
        <div className="setup-layout">
            {
                (step === 2) && <RoundButton onClick={() => setStep(1)}>
                <Back/>
            </RoundButton>
            }

            <div className={`setup-slider step-${step}`}>
                
                <div className="setup-step">
                    <Cadastro mode='setup' onSubmit={onNextStep}/>
                </div>

                <div className="setup-step">
                    <div className="setup-profile-wrapper">

                        <PersonEdit 
                            id="new-user"
                            person={nullPerson}
                            parents={{father: nullPerson, mother: nullPerson, married: false}}
                            conjuge={nullPerson}
                            onSubmit={onFinishSetup}
                            onCancel={() => setStep(1)}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}