import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const SwitchModal = ({ isOpen, onClose, onSubmit, editingSwitch, isLoading }) => {
  const [switchName, setSwitchName] = useState('');
  const [portsCount, setPortsCount] = useState(49);

  useEffect(() => {
    if (editingSwitch) {
      setSwitchName(editingSwitch.name);
      setPortsCount(editingSwitch.ports.length);
    } else {
      setSwitchName('');
      setPortsCount(49);
    }
  }, [editingSwitch, isOpen]);

  const handleSubmit = () => {
    onSubmit(switchName, portsCount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (isLoading) return;
      onClose(open);
    }}>
      <DialogContent className="sm:max-w-[425px] glass-effect">
        <DialogHeader>
          <DialogTitle className="gradient-text">{editingSwitch ? "Editar Switch" : "Adicionar Novo Switch"}</DialogTitle>
          <DialogDescription>
            {editingSwitch ? `Modifique os detalhes do switch ${editingSwitch.name}.` : "Configure os detalhes para o novo switch."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="switch-name" className="text-right">
              Nome
            </Label>
            <Input
              id="switch-name"
              value={switchName}
              onChange={(e) => setSwitchName(e.target.value)}
              className="col-span-3 bg-background/50"
              placeholder="Ex: Switch Andar 1"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="switch-ports" className="text-right">
              Portas
            </Label>
            <Input
              id="switch-ports"
              type="number"
              value={portsCount}
              onChange={(e) => setPortsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="col-span-3 bg-background/50"
              min="1"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editingSwitch ? "Salvar Alterações" : "Adicionar Switch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SwitchModal;