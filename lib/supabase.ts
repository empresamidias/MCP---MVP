
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yadyxktfpejqdhpgvkbx.supabase.co';
// Usamos a chave JWT fornecida diretamente para o Supabase para não confundir com a process.env.API_KEY (Gemini)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZHl4a3RmcGVqcWRocGd2a2J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY5MTM4MCwiZXhwIjoyMDgzMjY3MzgwfQ.yPg5PJ1TIOANp7EhJHYQgx4Izhu7y5wQlr7T1g-nWnY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
