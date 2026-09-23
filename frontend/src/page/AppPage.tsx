import { useState } from "react";
import { PersonScreen } from "../components/ui/PersonScreen";
import { ReactFlowProvider } from "@xyflow/react";
import type { RefreshTrigger } from "../types/refreshTrigger";
import { useParams } from "react-router-dom";
import { GenealogyFlow } from "../components/ui/GenealogyFlow";
import './AppPage.css';

export function AppPage(){
    const {personId: loggedUser} = useParams()
    const [selectedPersonId, setSelectedPersonId] = useState<number | 'new' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState<RefreshTrigger | null>(null);

    const handleAddNewPersonClick = () => {
        setSelectedPersonId('new');
        setIsModalOpen(true);
    }

    const showPersonScreen = (e: React.MouseEvent, clickedId: string) => {
      e.stopPropagation();
      setSelectedPersonId(Number(clickedId));
      setIsModalOpen(true);
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPersonId(null);
    }

    const handleGraphUpdate = (triggerData: RefreshTrigger) => {
        setRefreshTrigger(triggerData); 
    }
      
      return (
        <div style={{ width: '100%', height: '100dvh', position: 'relative' }}>
          {
            isModalOpen && 
          <PersonScreen 
                personId={selectedPersonId} 
                onClose={handleCloseModal} 
                onSuccessSave={handleGraphUpdate} 
            />
          }
          <ReactFlowProvider>
                <GenealogyFlow 
                    onDetailClick={showPersonScreen} 
                    refreshTrigger={refreshTrigger} 
                    handleAddPerson={handleAddNewPersonClick}
                    loggedPersonId={loggedUser}
                />
            </ReactFlowProvider>
        </div>
      )
}