
import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MultiSwitchDashboard from '@/components/MultiSwitchDashboard';
import LoginPage from '@/pages/LoginPage';
import UserManagementPage from '@/pages/UserManagementPage.jsx';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export const UserContext = createContext(null);

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authAttempted, setAuthAttempted] = useState(false);

  const fetchProfile = async (currentUser) => {
    if (!currentUser) {
      setUserProfile(null);
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role, full_name')
      .eq('id', currentUser.id)
      .maybeSingle(); 
      
    if (profileError) {
      console.error("Error fetching user profile:", profileError.message);
      setUserProfile(null);
      if (profileError.code === 'PGRST116' && profileError.details.includes("0 rows")) {
         console.warn("Profile not found for user:", currentUser.id, "Signing out.");
         await supabase.auth.signOut(); 
         return null;
      }
      return null;
    }
    
    if (!profile) {
        console.warn("Profile not found for user but no explicit DB error. This might happen if the user was just created and the profile trigger hasn't run yet or failed.", currentUser.id);
        setUserProfile(null);
        return null;
    }

    setUserProfile(profile);
    return profile;
  };

  useEffect(() => {
    const getInitialSessionAndProfile = async () => {
      setLoading(true);
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting initial session:", sessionError.message);
      }
      setSession(currentSession);
      if (currentSession) {
        await fetchProfile(currentSession.user);
      }
      setLoading(false);
      setAuthAttempted(true);
    };

    getInitialSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          setLoading(true);
          await fetchProfile(newSession.user);
          setLoading(false);
        } else {
          setUserProfile(null);
          setLoading(false); 
        }
        if (!authAttempted) setAuthAttempted(true);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [authAttempted]);

  if (!authAttempted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h1 className="text-3xl font-bold gradient-text">Iniciando Sistema</h1>
        <p className="text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }
  
  if (loading && session) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h1 className="text-3xl font-bold gradient-text">Carregando Perfil</h1>
        <p className="text-muted-foreground">Por favor, aguarde...</p>
      </div>
    );
  }


  return (
    <UserContext.Provider value={{ userProfile, session, loadingApp: loading }}>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/login" 
              element={!session ? <LoginPage /> : <Navigate to="/" />} 
            />
            <Route 
              path="/" 
              element={session ? <MultiSwitchDashboard /> : <Navigate to="/login" />} 
            />
            <Route
              path="/user-management"
              element={
                session ? <UserManagementPage /> : <Navigate to="/login" />
              }
            />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
