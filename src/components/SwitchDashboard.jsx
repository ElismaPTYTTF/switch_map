
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SwitchPort from '@/components/SwitchPort';
import DeviceModal from '@/components/DeviceModal';
import { 
  Network, 
  Search, 
  Plus, 
  Activity, 
  Wifi, 
  WifiOff,
  Settings,
  RefreshCw,
  Columns,
  Loader2
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const PORTS_PER_BLOCK = 16;

const SwitchDashboard = ({ switchData, onUpdateSwitchData, onAddPortsToSwitch, isLoading: isGlobalLoading }) => {
  const [ports, setPorts] = useState(switchData.ports);
  const [selectedPort, setSelectedPort] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);


  useEffect(() => {
    setPorts(switchData.ports);
  }, [switchData]);

  const handlePortClick = (port) => {
    setSelectedPort(port);
    setIsModalOpen(true);
  };

  const handleSaveDevice = (portNumber, deviceData) => {
    const updatedPorts = ports.map(port => 
      port.number === portNumber 
        ? { ...port, device: deviceData }
        : port
    );
    
    onUpdateSwitchData(switchData.id, { ...switchData, ports: updatedPorts });
  };

  const handleRemoveDevice = (portNumber) => {
    const updatedPorts = ports.map(port => 
      port.number === portNumber 
        ? { ...port, device: null }
        : port
    );
    onUpdateSwitchData(switchData.id, { ...switchData, ports: updatedPorts });
  };

  const handleAddPorts = () => {
    onAddPortsToSwitch(switchData.id, 8);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast({
      title: "Atualizando",
      description: `Verificando status das portas do ${switchData.name}...`,
    });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Atualizado",
        description: `Status das portas do ${switchData.name} verificado! (Simulado)`,
      });
    } catch (error) {
       toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar. " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredPorts = ports.filter(port => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const portMatch = port.number.toString().includes(searchTerm);
    const deviceMatch = port.device && (
      port.device.name?.toLowerCase().includes(searchLower) ||
      port.device.ip?.includes(searchTerm) ||
      port.device.mac?.toLowerCase().includes(searchLower)
    );
    
    return portMatch || deviceMatch;
  });

  const connectedPorts = ports.filter(port => port.device !== null).length;
  const disconnectedPorts = ports.length - connectedPorts;

  const portBlocks = [];
  if (filteredPorts.length > 0) {
    for (let i = 0; i < filteredPorts.length; i += PORTS_PER_BLOCK) {
      portBlocks.push(filteredPorts.slice(i, i + PORTS_PER_BLOCK));
    }
  }


  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="glass-effect">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{ports.length}</div>
                <div className="text-sm text-muted-foreground">Total de Portas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-green-500/20 text-green-400">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{connectedPorts}</div>
                <div className="text-sm text-muted-foreground">Conectadas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-gray-500/20 text-gray-400">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-400">{disconnectedPorts}</div>
                <div className="text-sm text-muted-foreground">Livres</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {ports.length > 0 ? Math.round((connectedPorts / ports.length) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Utilização</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 items-center justify-between"
      >
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={`Buscar em ${switchData.name}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background/50"
            disabled={isGlobalLoading || isRefreshing}
          />
        </div>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center space-x-2"
            disabled={isGlobalLoading || isRefreshing}
          >
            {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Atualizar Switch</span>
          </Button>
          
          <Button 
            onClick={handleAddPorts}
            className="flex items-center space-x-2"
            disabled={isGlobalLoading || isRefreshing}
          >
            {isGlobalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Adicionar Portas</span>
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>{switchData.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isGlobalLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="ml-3 text-muted-foreground">Carregando portas...</p>
              </div>
            ) : (
              <>
                {portBlocks.length === 0 && searchTerm && (
                  <p className="text-center text-muted-foreground py-8 text-lg">Nenhuma porta encontrada para "{searchTerm}".</p>
                )}
                {portBlocks.length === 0 && !searchTerm && ports.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-lg">Este switch não possui portas configuradas.</p>
                )}
                {portBlocks.length === 0 && !searchTerm && ports.length > 0 && filteredPorts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-lg">Nenhuma porta encontrada para os critérios de busca.</p>
                )}
                {portBlocks.map((block, blockIndex) => (
                  <div key={blockIndex} className="mb-8 last:mb-0">
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-border/50">
                        <Columns className="w-4 h-4 text-primary" />
                        <h3 className="text-md font-semibold text-primary">
                            Bloco de Portas {block[0].number} - {block[block.length - 1].number}
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                      {block.map((port, portIndex) => (
                        <motion.div
                          key={`${switchData.id}-${port.number}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: portIndex * 0.03 }}
                        >
                          <SwitchPort 
                            port={port} 
                            onClick={() => handlePortClick(port)}
                            disabled={isGlobalLoading || isRefreshing}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {selectedPort && (
        <DeviceModal
          port={{...selectedPort, switchId: switchData.id}}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPort(null);
          }}
          onSave={handleSaveDevice}
          onRemove={handleRemoveDevice}
          isLoading={isGlobalLoading || isRefreshing}
        />
      )}
    </div>
  );
};

export default SwitchDashboard;
