import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SwitchDashboard from '@/components/SwitchDashboard';
import SwitchModal from '@/components/SwitchModal';
import { useSwitchManagement } from '@/hooks/useSwitchManagement';
import { 
  Network, 
  PlusCircle, 
  ChevronDown, 
  ChevronUp,
  Trash2,
  Edit,
  Loader2,
  LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';


const MultiSwitchDashboard = ({ session }) => {
  const {
    switches,
    activeSwitchId,
    isLoading,
    fetchSwitches,
    addSwitch,
    editSwitch,
    deleteSwitch,
    updateSwitchData,
    addPortsToSwitch,
    setActiveSwitchId,
  } = useSwitchManagement();

  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [editingSwitch, setEditingSwitch] = useState(null);

  useEffect(() => {
    fetchSwitches();
  }, [fetchSwitches]);

  const handleOpenAddModal = () => {
    setEditingSwitch(null);
    setIsSwitchModalOpen(true);
  };

  const handleOpenEditModal = (switchObj) => {
    setEditingSwitch(switchObj);
    setIsSwitchModalOpen(true);
  };

  const handleSwitchModalSubmit = async (name, portsCount) => {
    let success = false;
    if (editingSwitch) {
      success = await editSwitch(editingSwitch, name, portsCount);
    } else {
      const newSwitch = await addSwitch(name, portsCount);
      success = !!newSwitch;
    }
    if (success) {
      setIsSwitchModalOpen(false);
      setEditingSwitch(null);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    }
  };

  const activeSwitchData = switches.find(s => s.id === activeSwitchId);

  if (isLoading && switches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 to-slate-800">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="ml-4 text-xl text-muted-foreground">Carregando seus switches...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-8"
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
            <Network className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-extrabold gradient-text">
              Painel Multi-Switch
            </h1>
            <p className="text-muted-foreground text-xl">
              Gerencie todos os seus switches em um só lugar.
            </p>
          </div>
        </div>
        <Button onClick={handleLogout} variant="outline" className="bg-transparent hover:bg-primary/10 border-primary text-primary">
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:w-1/4 space-y-3"
        >
          <Card className="glass-effect sticky top-6">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold gradient-text">Switches</h2>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleOpenAddModal}
                  className="text-primary hover:text-primary/80"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <PlusCircle className="w-5 h-5 mr-1" />}
                   Novo
                </Button>
              </div>
              <div className="max-h-[calc(100vh-240px)] overflow-y-auto space-y-2 pr-1">
                {switches.map(s => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: switches.indexOf(s) * 0.05 }}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out
                      ${activeSwitchId === s.id 
                        ? 'bg-primary/20 border border-primary shadow-lg scale-105' 
                        : 'bg-background/30 hover:bg-accent/50 border border-transparent hover:border-primary/30'
                      }`}
                    onClick={() => !isLoading && setActiveSwitchId(s.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${activeSwitchId === s.id ? 'text-primary' : 'text-foreground'}`}>{s.name}</span>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); !isLoading && handleOpenEditModal(s); }} disabled={isLoading}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); !isLoading && deleteSwitch(s.id); }} disabled={isLoading}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {activeSwitchId === s.id ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    </div>
                    {activeSwitchId === s.id && (
                       <p className="text-xs text-muted-foreground mt-1">{s.ports.length} portas</p>
                    )}
                  </motion.div>
                ))}
                {switches.length === 0 && !isLoading && (
                    <p className="text-center text-muted-foreground py-4">Nenhum switch cadastrado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:w-3/4"
        >
          <AnimatePresence mode="wait">
            {activeSwitchData && !isLoading ? (
              <motion.div
                key={activeSwitchData.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SwitchDashboard 
                  switchData={activeSwitchData} 
                  onUpdateSwitchData={updateSwitchData}
                  onAddPortsToSwitch={addPortsToSwitch}
                  isLoading={isLoading}
                />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full glass-effect rounded-lg p-10"
              >
                {isLoading && switches.length > 0 ? (
                  <>
                    <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                    <h2 className="text-2xl font-semibold text-foreground mb-2">Carregando Switch...</h2>
                  </>
                ) : (
                  <>
                    <Network className="w-24 h-24 text-primary/50 mb-6" />
                    <h2 className="text-2xl font-semibold text-foreground mb-2">Nenhum Switch Selecionado</h2>
                    <p className="text-muted-foreground text-center mb-6">
                      Selecione um switch na lista à esquerda para ver seus detalhes ou adicione um novo switch.
                    </p>
                    <Button onClick={handleOpenAddModal} disabled={isLoading}>
                      <PlusCircle className="w-5 h-5 mr-2" /> Adicionar Novo Switch
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <SwitchModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        onSubmit={handleSwitchModalSubmit}
        editingSwitch={editingSwitch}
        isLoading={isLoading}
      />
    </div>
  );
};

export default MultiSwitchDashboard;