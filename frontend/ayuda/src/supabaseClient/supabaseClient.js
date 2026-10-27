import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://wsoyxjgpfvhecvczawqz.supabase.co";
const supabaseKey = "sb_publishable_j6SQMbEsxY9S9pIfgyEtFw_4fy_uzt1";

export const supabase = createClient(supabaseUrl, supabaseKey);
