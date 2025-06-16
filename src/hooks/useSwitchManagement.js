import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

export const useSwitchManagement = (initialSwitches = [], initialActiveSwitchId = null) => {
  const [switches, setSwitches] = useState(initialSwitches);
  const [activeSwitchId, setActiveSwitchId] = useState(initialActiveSwitchId);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSwitches = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: switchesData, error: switchesError } = await supabase
        .from('switches')
        .select('id, name');

      if (switchesError) throw switchesError;

      const switchesWithPorts = await Promise.all(
        switchesData.map(async (s) => {
          const { data: portsData, error: portsError } = await supabase
            .from('ports')
            .select('port_number, device_name, device_mac, device_ip, device_type')
            .eq('switch_id', s.id)
            .order('port_number', { ascending: true });

          if (portsError) throw portsError;
          
          const formattedPorts = portsData.map(p => ({
            number: p.port_number,
            device: p.device_name ? {
              name: p.device_name,
              mac: p.device_mac,
              ip: p.device_ip,
              type: p.device_type,
            } : null,
          }));
          return { ...s, ports: formattedPorts };
        })
      );
      
      setSwitches(switchesWithPorts);
      if (switchesWithPorts.length > 0 && !activeSwitchId) {
        setActiveSwitchId(switchesWithPorts[0].id);
      } else if (switchesWithPorts.length === 0) {
        setActiveSwitchId(null);
      }
    } catch (error) {
      console.error("Error fetching switches:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível buscar os switches do banco de dados. " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeSwitchId]);

  const addSwitch = async (newSwitchName, newSwitchPortsCount) => {
    if (!newSwitchName.trim() || newSwitchPortsCount <= 0) {
      toast({
        title: "Erro",
        description: "Nome do switch e número de portas são obrigatórios e o número de portas deve ser positivo.",
        variant: "destructive",
      });
      return null;
    }
    setIsLoading(true);
    try {
      const { data: newSwitchData, error: switchError } = await supabase
        .from('switches')
        .insert({ name: newSwitchName })
        .select()
        .single();

      if (switchError) throw switchError;

      const portsPayload = Array.from({ length: parseInt(newSwitchPortsCount, 10) }, (_, j) => ({
        switch_id: newSwitchData.id,
        port_number: j + 1,
      }));

      const { error: portsError } = await supabase.from('ports').insert(portsPayload);
      if (portsError) {
        await supabase.from('switches').delete().eq('id', newSwitchData.id);
        throw portsError;
      }
      
      await fetchSwitches();
      setActiveSwitchId(newSwitchData.id);
      toast({
        title: "Sucesso",
        description: `Switch "${newSwitchName}" adicionado!`,
      });
      return newSwitchData;
    } catch (error) {
      console.error("Error adding switch:", error);
      toast({
        title: "Erro ao adicionar switch",
        description: "Não foi possível adicionar o novo switch. " + error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const editSwitch = async (editingSwitch, newSwitchName, newSwitchPortsCount) => {
    if (!editingSwitch || !newSwitchName.trim() || newSwitchPortsCount <= 0) {
      toast({
        title: "Erro",
        description: "Nome do switch e número de portas são obrigatórios.",
        variant: "destructive",
      });
      return false;
    }
    setIsLoading(true);
    try {
      const { error: switchError } = await supabase
        .from('switches')
        .update({ name: newSwitchName })
        .eq('id', editingSwitch.id);
      if (switchError) throw switchError;

      const currentPortsCount = editingSwitch.ports.length;
      const newPortsCountInt = parseInt(newSwitchPortsCount, 10);

      if (newPortsCountInt !== currentPortsCount) {
        await supabase.from('ports').delete().eq('switch_id', editingSwitch.id);
        const portsPayload = Array.from({ length: newPortsCountInt }, (_, j) => ({
          switch_id: editingSwitch.id,
          port_number: j + 1,
        }));
        const { error: portsInsertError } = await supabase.from('ports').insert(portsPayload);
        if (portsInsertError) throw portsInsertError;
      }
      
      await fetchSwitches();
      toast({
        title: "Sucesso",
        description: `Switch "${newSwitchName}" atualizado!`,
      });
      return true;
    } catch (error) {
      console.error("Error editing switch:", error);
      toast({
        title: "Erro ao editar switch",
        description: "Não foi possível editar o switch. " + error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSwitch = async (switchId) => {
    const switchToDelete = switches.find(s => s.id === switchId);
    if (!switchToDelete) return false;

    if (!window.confirm(`Tem certeza que deseja remover o switch "${switchToDelete.name}"? Esta ação não pode ser desfeita e removerá todas as suas portas e dispositivos conectados.`)) {
        return false;
    }
    setIsLoading(true);
    try {
      await supabase.from('ports').delete().eq('switch_id', switchId);
      const { error } = await supabase.from('switches').delete().eq('id', switchId);
      if (error) throw error;
      
      await fetchSwitches();
      if (activeSwitchId === switchId) {
         setActiveSwitchId(switches.length > 1 ? switches.find(s => s.id !== switchId)?.id : null);
      }
      toast({
        title: "Sucesso",
        description: `Switch "${switchToDelete.name}" removido!`,
      });
      return true;
    } catch (error) {
      console.error("Error deleting switch:", error);
      toast({
        title: "Erro ao remover switch",
        description: "Não foi possível remover o switch. " + error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateSwitchData = async (switchId, updatedData) => {
    setIsLoading(true);
    try {
      const { error: switchUpdateError } = await supabase
        .from('switches')
        .update({ name: updatedData.name })
        .eq('id', switchId);
      if (switchUpdateError) throw switchUpdateError;

      await Promise.all(updatedData.ports.map(async (port) => {
        const { error: portUpdateError } = await supabase
          .from('ports')
          .upsert({
            switch_id: switchId,
            port_number: port.number,
            device_name: port.device?.name || null,
            device_mac: port.device?.mac || null,
            device_ip: port.device?.ip || null,
            device_type: port.device?.type || null,
          }, { onConflict: 'switch_id, port_number' });
        if (portUpdateError) throw portUpdateError;
      }));
      
      await fetchSwitches();
      toast({
        title: "Sucesso!",
        description: `Switch "${updatedData.name}" atualizado.`,
      });
    } catch (error) {
      console.error("Error updating switch data:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados do switch. " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addPortsToSwitch = async (switchId, numPortsToAdd) => {
    const currentSwitch = switches.find(s => s.id === switchId);
    if (!currentSwitch) return;

    setIsLoading(true);
    try {
      const existingPortsCount = currentSwitch.ports.length;
      const newPortsPayload = Array.from({ length: numPortsToAdd }, (_, i) => ({
        switch_id: switchId,
        port_number: existingPortsCount + i + 1,
      }));

      const { error } = await supabase.from('ports').insert(newPortsPayload);
      if (error) throw error;

      await fetchSwitches();
      toast({
        title: "Sucesso",
        description: `${numPortsToAdd} portas adicionadas ao ${currentSwitch.name}!`,
      });
    } catch (error) {
      console.error("Error adding ports:", error);
      toast({
        title: "Erro ao adicionar portas",
        description: "Não foi possível adicionar novas portas. " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return {
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
    setIsLoading
  };
};