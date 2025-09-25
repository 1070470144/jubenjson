import { createClient } from '@supabase/supabase-js';

// 从 Vite 环境变量读取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

// 单例模式确保只有一个Supabase客户端实例
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      throw error;
    }
  }

  return supabaseInstance;
};

// 导出默认客户端以保持向后兼容（仅在配置可用时）
export const supabase = (() => {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
})();