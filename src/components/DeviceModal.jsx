import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Monitor, 
  Laptop, 
  Smartphone, 
  Server, 
  Wifi, 
  WifiOff,
  Edit3,
  Trash2,
  Plus,
  Loader2,
  Router as RouterIcon, 
  Video
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const deviceTypes = [
  { value: 'computer', label: 'Computador', icon: Monitor },
  { value: 'laptop', label: 'Laptop', icon: Laptop },
  { value: 'phone', label: 'Smartphone', icon: Smartphone },
  { value: 'server', label: 'Servidor', icon: Server },
  { value: 'router', label: 'Roteador', icon: RouterIcon },
  { value: 'dvr', label: 'DVR', icon: Video },
];

const DeviceModal = ({ port, isOpen, onClose, onSave, onRemove, isLoading }) => {
  const [deviceData, setDeviceData] = useState({
    name: '',
    mac: '',
    ip: '',
    type: 'computer'
  });

  useEffect(() => {
    if (port && port.device) {
      setDeviceData({
        name: port.device.name || '',
        mac: port.device.mac || '',
        ip: port.device.ip || '',
        type: port.device.type || 'computer'
      });
    } else {
      setDeviceData({ name: '', mac: '', ip: '', type: 'computer' });
    }
  }, [port]);


  const handleSave = () => {
    if (!deviceData.name || !deviceData.mac || !deviceData.ip) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(deviceData.mac)) {
      toast({
        title: "Erro",
        description: "Formato de MAC inválido! Use: XX:XX:XX:XX:XX:XX",
        variant: "destructive"
      });
      return;
    }

    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(deviceData.ip)) {
      toast({
        title: "Erro",
        description: "Formato de IP inválido!",
        variant: "destructive"
      });
      return;
    }

    onSave(port.number, deviceData);
    onClose();
  };

  const handleRemoveAction = () => {
    onRemove(port.number);
    onClose();
  };

  if (!port) return null;

  const isConnected = port.device !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && onClose(open)}>
      <DialogContent className="sm:max-w-[500px] glass-effect">
        <DialogHeader>
          <DialogTitle className="gradient-text text-xl">
            Porta {port.number} {port.switchId ? `(Switch ${port.switchId.split('-')[1]})` : ''}
          </DialogTitle>
          <DialogDescription>
            {isConnected 
              ? 'Editar dispositivo conectado' 
              : 'Conectar novo dispositivo'
            }
          </DialogDescription>
        </DialogHeader>

        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="device-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  isConnected 
                    ? 'bg-orange-500/20 text-orange-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-medium">
                    Status: {isConnected ? 'Conectada' : 'Desconectada'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Porta {port.number}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Dispositivo</Label>
              <Input
                id="name"
                placeholder="Ex: Computador da Recepção"
                value={deviceData.name}
                onChange={(e) => setDeviceData({...deviceData, name: e.target.value})}
                className="bg-background/50"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mac">Endereço MAC</Label>
              <Input
                id="mac"
                placeholder="Ex: 00:1B:44:11:3A:B7"
                value={deviceData.mac}
                onChange={(e) => setDeviceData({...deviceData, mac: e.target.value.toUpperCase()})}
                className="bg-background/50"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip">Endereço IP</Label>
              <Input
                id="ip"
                placeholder="Ex: 192.168.1.100"
                value={deviceData.ip}
                onChange={(e) => setDeviceData({...deviceData, ip: e.target.value})}
                className="bg-background/50"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo do Dispositivo</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {deviceTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <motion.button
                      key={type.value}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      onClick={() => !isLoading && setDeviceData({...deviceData, type: type.value})}
                      className={`p-3 rounded-lg border transition-all ${
                        deviceData.type === type.value
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-border bg-background/50 hover:bg-accent'
                      } ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
                      disabled={isLoading}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{type.label}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-between space-x-2">
            {isConnected && (
              <Button 
                variant="destructive" 
                onClick={handleRemoveAction}
                className="flex items-center space-x-2"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Remover</span>
              </Button>
            )}
            
            <div className="flex space-x-2 ml-auto">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex items-center space-x-2" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isConnected ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                <span>{isConnected ? 'Atualizar' : 'Conectar'}</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceModal;