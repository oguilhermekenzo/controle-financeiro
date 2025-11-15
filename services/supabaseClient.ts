import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tinsegywkpizuyxcllbh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbnNlZ3l3a3BpenV5eGNsbGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTkyNDUsImV4cCI6MjA3ODY5NTI0NX0.StC2UmFPKWZKO_4BTKXkJNm2ootcq6mNeY4VXRHqDbg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
