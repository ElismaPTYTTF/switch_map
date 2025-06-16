
import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Users, PlusCircle, Edit, Trash2, Loader2, ShieldCheck, UserCog, ChevronLeft, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserManagementPage = () => {
  const { session, userProfile } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'feeder', full_name: '' });
  const [showPromotionUI, setShowPromotionUI] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    const fetchUsers = async () => {
      if (!session) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('manage-users', {
          body: JSON.stringify({ action: 'list_users' }),
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (error || (data && data.error)) {
          const errorMessage = (error && error.message) || (data && data.error);
          throw new Error(errorMessage);
        }
        
        setUsers(data || []);
        setShowPromotionUI(false);
      } catch (error) {
        if (error.message.includes('Forbidden')) {
          setShowPromotionUI(true);
        } else {
          toast({
            title: 'Erro ao buscar usuários',
            description: error.message,
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [session]);

  const handlePromotion = async () => {
    setIsPromoting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: JSON.stringify({ action: 'promote_to_admin_if_first' }),
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error || (data && data.error)) {
        const errorMessage = (error && error.message) || (data && data.error) || "Falha ao promover. Isso só é possível para o primeiro usuário.";
        throw new Error(errorMessage);
      }

      toast({
        title: 'Sucesso!',
        description: 'Você foi promovido a Administrador. A página será recarregada.',
      });

      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('Promotion error:', error);
      toast({
        title: 'Erro na Promoção',
        description: error.message,
        variant: 'destructive',
      });
      setIsPromoting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const openModal = (user = null) => {
    if (!isAdmin) return;
    setEditingUser(user);
    if (user) {
      setFormData({ email: user.email, password: '', role: user.role, full_name: user.full_name || '' });
    } else {
      setFormData({ email: '', password: '', role: 'feeder', full_name: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session || !isAdmin) return;
    setIsLoading(true);

    const actionType = editingUser ? 'update_user_role' : 'invite_user';
    const payload = editingUser 
      ? { userId: editingUser.id, role: formData.role, full_name: formData.full_name }
      : { email: formData.email, password: formData.password, role: formData.role, full_name: formData.full_name };
    
    if (!editingUser && !formData.password && actionType === 'invite_user') {
        toast({
            title: "Senha Requerida",
            description: "Para convidar um novo usuário, uma senha inicial é necessária.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: JSON.stringify({ action: actionType, userData: payload }),
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      toast({
        title: `Usuário ${editingUser ? 'atualizado' : 'convidado'} com sucesso!`,
        description: data.message,
      });
      const fetchUsersAfterAction = async () => {
        const { data, error } = await supabase.functions.invoke('manage-users', { body: JSON.stringify({ action: 'list_users' }), headers: { Authorization: `Bearer ${session.access_token}` } });
        if (!error) setUsers(data);
      }
      fetchUsersAfterAction();
      closeModal();
    } catch (error) {
      toast({
        title: `Erro ao ${editingUser ? 'atualizar' : 'convidar'} usuário`,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!session || !isAdmin) return;
    if (!window.confirm(`Tem certeza que deseja remover o usuário ${userEmail}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: JSON.stringify({ action: 'delete_user', userData: { userId } }),
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'Usuário removido com sucesso!',
        description: data.message,
      });
      const fetchUsersAfterAction = async () => {
        const { data, error } = await supabase.functions.invoke('manage-users', { body: JSON.stringify({ action: 'list_users' }), headers: { Authorization: `Bearer ${session.access_token}` } });
        if (!error) setUsers(data);
      }
      fetchUsersAfterAction();
    } catch (error) {
      toast({
        title: 'Erro ao remover usuário',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h1 className="text-3xl font-bold gradient-text">Verificando Permissões</h1>
        <p className="text-muted-foreground">Aguarde um momento...</p>
      </div>
    );
  }

  if (showPromotionUI && !isAdmin) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col justify-center items-center">
         <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center glass-effect p-10 rounded-xl shadow-2xl">
            <Award className="w-20 h-20 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-extrabold gradient-text">Primeiros Passos</h1>
            <p className="text-muted-foreground text-lg mt-2 max-w-md mx-auto">
                Bem-vindo! Para começar a gerenciar o sistema, promova sua conta para Administrador.
            </p>
            <Button onClick={handlePromotion} disabled={isPromoting} className="mt-8 text-lg py-6 px-10">
                {isPromoting ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <ShieldCheck className="w-6 h-6 mr-2" />}
                {isPromoting ? 'Promovendo...' : 'Tornar-se Administrador'}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">(Esta opção só está disponível para o primeiro usuário registrado)</p>
         </motion.div>
         <Button asChild variant="link" className="mt-8 text-primary/80">
            <Link to="/">Voltar ao Painel</Link>
         </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col justify-center items-center">
        <h1 className="text-4xl font-extrabold gradient-text">Acesso Negado</h1>
        <p className="text-muted-foreground text-lg mt-2">Você não tem permissão para acessar esta página.</p>
        <Button asChild variant="outline" className="mt-8 bg-transparent hover:bg-primary/10 border-primary text-primary">
          <Link to="/">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <UserCog className="w-12 h-12 text-primary" />
          <div>
            <h1 className="text-4xl font-extrabold gradient-text">Gerenciamento de Usuários</h1>
            <p className="text-muted-foreground text-lg">Adicione, edite e remova usuários do sistema.</p>
          </div>
        </div>
        <Button asChild variant="outline" className="bg-transparent hover:bg-primary/10 border-primary text-primary">
          <Link to="/">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Link>
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass-effect p-6 rounded-lg shadow-xl">
        <div className="flex justify-end mb-4">
          <Button onClick={() => openModal()} disabled={isLoading || !isAdmin}>
            <PlusCircle className="w-5 h-5 mr-2" />
            Convidar Novo Usuário
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white/80">Nome Completo</TableHead>
              <TableHead className="text-white/80">Email</TableHead>
              <TableHead className="text-white/80">Perfil</TableHead>
              <TableHead className="text-white/80">Criado em</TableHead>
              <TableHead className="text-right text-white/80">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-700/50">
                <TableCell>{user.full_name || user.email.split('@')[0]}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-500/30 text-purple-300' : 'bg-sky-500/30 text-sky-300'}`}>
                    {user.role === 'admin' ? 'Administrador' : 'Alimentador'}
                  </span>
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" className="hover:text-primary" onClick={() => openModal(user)} disabled={isLoading || !isAdmin}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeleteUser(user.id, user.email)} disabled={isLoading || !isAdmin || user.id === session?.user?.id}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.length === 0 && !isLoading && (
             <p className="text-center text-muted-foreground py-10">Nenhum usuário encontrado.</p>
        )}
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[480px] glass-effect">
          <DialogHeader>
            <DialogTitle className="gradient-text">{editingUser ? 'Editar Usuário' : 'Convidar Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingUser ? `Modifique os detalhes de ${editingUser.email}.` : 'Preencha os dados para convidar um novo usuário.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="Nome Sobrenome" className="bg-background/50" disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="usuario@example.com" className="bg-background/50" required disabled={isLoading || !!editingUser} />
            </div>
            {!editingUser && (
              <div>
                <Label htmlFor="password">Senha Inicial</Label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="********" className="bg-background/50" required={!editingUser} disabled={isLoading} />
                 <p className="text-xs text-muted-foreground mt-1">O usuário será solicitado a alterar esta senha no primeiro login.</p>
              </div>
            )}
            <div>
              <Label htmlFor="role">Perfil</Label>
              <Select value={formData.role} onValueChange={handleRoleChange} disabled={isLoading || (editingUser && editingUser.id === session?.user?.id)}>
                <SelectTrigger className="w-full bg-background/50">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feeder">Alimentador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              {editingUser && editingUser.id === session?.user?.id && <p className="text-xs text-destructive mt-1">Você não pode alterar seu próprio perfil.</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingUser ? 'Salvar Alterações' : 'Convidar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;
