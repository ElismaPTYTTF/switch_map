
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://plpbphrejghlsitnlesh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscGJwaHJlamdobHNpdG5sZXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzM2MjEsImV4cCI6MjA2NTE0OTYyMX0.FnHwJqT7oVufgq9XKdApvX_iJ6ftNdBYEWNbeXs0RyY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
