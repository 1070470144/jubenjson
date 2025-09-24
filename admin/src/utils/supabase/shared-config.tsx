/**
 * 共享数据库配置文件
 * 用于多个项目间共享同一个Supabase数据库实例
 */

// 从环境变量或配置文件中获取共享的Supabase配置
export const sharedSupabaseConfig = {
  // 主项目的Supabase配置（当前血染钟楼管理系统）
  primary: {
    projectId: "byqofbocrdklpzzxbkfk",
    publicAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cW9mYm9jcmRrbHB6enhia2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODUyNDgsImV4cCI6MjA3NDI2MTI0OH0.t-n4pex5OfOWQ2Kzy03dEeUaC5t8fcidkUsaNLLAhJw",
    url: "https://byqofbocrdklpzzxbkfk.supabase.co"
  },
  
  // 数据命名空间配置 - 用于区分不同项目的数据
  namespaces: {
    // 血染钟楼剧本管理系统
    botc: {
      prefix: "botc_",
      tables: {
        scripts: "script:",
        characters: "character:",
        users: "user:",
        sessions: "session:"
      }
    },
    
    // 第二个项目（请根据实际项目调整）
    project2: {
      prefix: "proj2_",
      tables: {
        data: "data:",
        config: "config:",
        cache: "cache:"
      }
    }
  },
  
  // 共享数据配置
  shared: {
    // 用户认证是共享的
    auth: true,
    // 共享的数据前缀
    sharedPrefix: "shared_",
    // 共享的数据类型
    sharedTables: {
      globalConfig: "shared_config:",
      crossProjectData: "shared_data:"
    }
  }
}

// 获取当前项目的命名空间
export function getCurrentNamespace(): string {
  // 可以通过环境变量或其他方式来确定当前项目
  // 在浏览器环境中，我们使用默认值
  if (typeof window !== 'undefined') {
    return 'botc' // 默认为血染钟楼项目
  }
  return process.env.PROJECT_NAMESPACE || 'botc'
}

// 生成带命名空间的key
export function generateNamespacedKey(namespace: string, table: string, key: string): string {
  const config = sharedSupabaseConfig.namespaces[namespace]
  if (!config) {
    throw new Error(`Unknown namespace: ${namespace}`)
  }
  
  const tablePrefix = config.tables[table] || `${table}:`
  return `${config.prefix}${tablePrefix}${key}`
}

// 生成共享数据的key
export function generateSharedKey(table: string, key: string): string {
  const tablePrefix = sharedSupabaseConfig.shared.sharedTables[table] || `${table}:`
  return `${sharedSupabaseConfig.shared.sharedPrefix}${tablePrefix}${key}`
}

// 解析key，提取命名空间和实际key
export function parseKey(fullKey: string): { namespace: string; table: string; key: string; isShared: boolean } {
  // 检查是否是共享数据
  if (fullKey.startsWith(sharedSupabaseConfig.shared.sharedPrefix)) {
    const remainingKey = fullKey.substring(sharedSupabaseConfig.shared.sharedPrefix.length)
    
    // 找到对应的共享表
    for (const [table, prefix] of Object.entries(sharedSupabaseConfig.shared.sharedTables)) {
      if (remainingKey.startsWith(prefix)) {
        return {
          namespace: 'shared',
          table,
          key: remainingKey.substring(prefix.length),
          isShared: true
        }
      }
    }
  }
  
  // 检查命名空间
  for (const [namespace, config] of Object.entries(sharedSupabaseConfig.namespaces)) {
    if (fullKey.startsWith(config.prefix)) {
      const remainingKey = fullKey.substring(config.prefix.length)
      
      // 找到对应的表
      for (const [table, prefix] of Object.entries(config.tables)) {
        if (remainingKey.startsWith(prefix)) {
          return {
            namespace,
            table,
            key: remainingKey.substring(prefix.length),
            isShared: false
          }
        }
      }
    }
  }
  
  throw new Error(`Unable to parse key: ${fullKey}`)
}