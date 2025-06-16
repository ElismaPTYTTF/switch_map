
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { LogIn, AlertTriangle, Loader2, Network } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }
      
      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para o painel...',
      });

    } catch (err) {
      console.error("Login error:", err);
      let displayError = 'Falha no login. Verifique suas credenciais.';
      if (err.message.includes("Invalid login credentials")) {
        displayError = "Credenciais inválidas. Verifique seu email e senha.";
      } else if (err.message.includes("Email not confirmed")) {
        displayError = "Email não confirmado. Por favor, verifique sua caixa de entrada.";
      } else if (err.message.includes("User not found") || err.message.includes("No user found")) {
        displayError = "Usuário não encontrado. Verifique o email digitado.";
      }
      setError(displayError);
      toast({
        title: 'Erro de Autenticação',
        description: displayError,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center space-x-4 mb-10"
      >
        <Network className="w-16 h-16 text-primary" />
        <div>
          <h1 className="text-5xl font-extrabold gradient-text">Switch Manager Pro</h1>
          <p className="text-muted-foreground text-lg">Acesso seguro ao seu painel de controle.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="w-full max-w-md glass-effect shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center gradient-text">
              Login Seguro
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Apenas usuários autorizados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-primary"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-primary"
                  disabled={loading}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center p-3 bg-destructive/20 text-destructive border border-destructive/50 rounded-md"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold py-3 text-base" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
      <p className="text-center text-muted-foreground mt-8 text-sm">
        Switch Manager Pro &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
};

export default LoginPage;
