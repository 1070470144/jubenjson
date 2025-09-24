import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// 单例模式确保只有一个Supabase客户端实例
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    // 检查是否有有效的配置
    if (!projectId || !publicAnonKey || 
        projectId === 'your-project-id' || publicAnonKey === 'your-anon-key') {
      console.warn('Supabase not configured - using demo mode');
      throw new Error('Supabase not configured');
    }
    
    try {
      supabaseInstance = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          }
        }
      );
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