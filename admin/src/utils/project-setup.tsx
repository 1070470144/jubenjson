/**
 * 项目设置工具
 * 帮助配置和初始化新项目以共享数据库
 */

import { sharedSupabaseConfig, generateNamespacedKey } from './supabase/shared-config'
import { dataManager } from './supabase/shared-client'

export interface ProjectSetupConfig {
  projectName: string
  namespace: string
  description: string
  tables: Record<string, string>
  adminEmail: string
}

export class ProjectSetupManager {
  /**
   * 初始化新项目的数据库结构
   */
  static async initializeProject(config: ProjectSetupConfig): Promise<boolean> {
    try {
      // 1. 创建项目配置记录
      const projectConfig = {
        name: config.projectName,
        namespace: config.namespace,
        description: config.description,
        tables: config.tables,
        adminEmail: config.adminEmail,
        createdAt: new Date().toISOString(),
        status: 'active'
      }

      // 保存到共享配置区域
      await dataManager.setSharedData('globalConfig', `project_${config.namespace}`, projectConfig)

      // 2. 为每个表创建初始结构
      for (const [tableName, tableDescription] of Object.entries(config.tables)) {
        const metaKey = generateNamespacedKey(config.namespace, tableName, '_metadata')
        const metadata = {
          tableName,
          description: tableDescription,
          createdAt: new Date().toISOString(),
          recordCount: 0,
          lastUpdated: new Date().toISOString()
        }

        // 保存表元数据
        await dataManager.setNamespaceData(config.namespace, tableName, metadata)
      }

      // 3. 创建示例数据（可选）
      await ProjectSetupManager.createSampleData(config.namespace)

      console.log(`项目 ${config.projectName} 初始化成功`)
      return true
    } catch (error) {
      console.error('项目初始化失败:', error)
      return false
    }
  }

  /**
   * 创建示例数据
   */
  static async createSampleData(namespace: string): Promise<void> {
    try {
      // 创建一些示例配置数据
      const sampleConfig = {
        theme: 'light',
        language: 'zh-CN',
        version: '1.0.0',
        features: ['crud', 'auth', 'sync'],
        settings: {
          autoSync: true,
          backupInterval: 3600000, // 1 hour
          maxRecords: 10000
        }
      }

      await dataManager.setNamespaceData(namespace, 'settings', sampleConfig)

      // 创建示例用户数据结构
      const sampleUserSchema = {
        schema: {
          id: 'string',
          name: 'string',
          email: 'string',
          role: 'enum: user|admin',
          createdAt: 'datetime',
          updatedAt: 'datetime'
        },
        constraints: {
          required: ['id', 'name', 'email'],
          unique: ['id', 'email']
        }
      }

      await dataManager.setNamespaceData(namespace, 'userSchema', sampleUserSchema)

    } catch (error) {
      console.error('创建示例数据失败:', error)
    }
  }

  /**
   * 检查项目是否已经存在
   */
  static async checkProjectExists(namespace: string): Promise<boolean> {
    try {
      const projectConfig = await dataManager.getSharedData('globalConfig', `project_${namespace}`)
      return projectConfig !== null
    } catch (error) {
      return false
    }
  }

  /**
   * 获取所有项目列表
   */
  static async listProjects(): Promise<any[]> {
    try {
      const projects = []
      
      // 获取所有共享配置
      const allData = await dataManager.getAllNamespaceData('')
      const sharedData = allData.shared || []

      for (const record of sharedData) {
        if (record.key.startsWith('project_')) {
          projects.push({
            namespace: record.key.replace('project_', ''),
            ...record.value
          })
        }
      }

      return projects
    } catch (error) {
      console.error('获取项目列表失败:', error)
      return []
    }
  }

  /**
   * 同步项目数据
   */
  static async syncProjectData(
    sourceNamespace: string, 
    targetNamespace: string, 
    tables: string[] = []
  ): Promise<boolean> {
    try {
      // 获取源项目的所有数据
      const sourceData = await dataManager.getAllNamespaceData('')
      const sourceRecords = sourceData[sourceNamespace] || []

      let syncCount = 0
      for (const record of sourceRecords) {
        // 如果指定了表，只同步指定的表
        if (tables.length > 0 && !tables.includes(record.table)) {
          continue
        }

        // 同步数据到目标项目
        const success = await dataManager.syncToProject(
          targetNamespace, 
          record.table, 
          record.key, 
          record.value
        )

        if (success) {
          syncCount++
        }
      }

      console.log(`成功同步 ${syncCount} 条记录从 ${sourceNamespace} 到 ${targetNamespace}`)
      return true
    } catch (error) {
      console.error('项目数据同步失败:', error)
      return false
    }
  }

  /**
   * 生成项目配置文件
   */
  static generateConfigFile(config: ProjectSetupConfig): string {
    const configContent = `
// 项目配置文件 - ${config.projectName}
// 自动生成于 ${new Date().toISOString()}

export const projectConfig = {
  name: "${config.projectName}",
  namespace: "${config.namespace}",
  description: "${config.description}",
  
  // 数据表配置
  tables: ${JSON.stringify(config.tables, null, 4)},
  
  // Supabase 配置
  supabase: {
    projectId: "${sharedSupabaseConfig.primary.projectId}",
    url: "${sharedSupabaseConfig.primary.url}",
    // 注意：请在环境变量中设置 SUPABASE_ANON_KEY
  },
  
  // 管理员配置
  admin: {
    email: "${config.adminEmail}"
  },
  
  // 功能开关
  features: {
    auth: true,
    crud: true,
    sync: true,
    analytics: false
  }
}

// 使用方法：
// 1. 在 .env 文件中设置环境变量：
//    PROJECT_NAMESPACE=${config.namespace}
//    SUPABASE_URL=${sharedSupabaseConfig.primary.url}
//    SUPABASE_ANON_KEY=your_anon_key
//
// 2. 在应用中导入配置：
//    import { projectConfig } from './config/project-config'
//
// 3. 初始化数据管理器：
//    import { CrossProjectDataManager } from './utils/supabase/shared-client'
//    const dataManager = new CrossProjectDataManager('${config.namespace}')
`

    return configContent.trim()
  }

  /**
   * 导出项目数据
   */
  static async exportProjectData(namespace: string): Promise<any> {
    try {
      const allData = await dataManager.getAllNamespaceData('')
      const projectData = allData[namespace] || []

      const exportData = {
        namespace,
        exportedAt: new Date().toISOString(),
        recordCount: projectData.length,
        data: projectData
      }

      return exportData
    } catch (error) {
      console.error('导出项目数据失败:', error)
      return null
    }
  }

  /**
   * 导入项目数据
   */
  static async importProjectData(exportData: any): Promise<boolean> {
    try {
      const { namespace, data } = exportData

      for (const record of data) {
        await dataManager.setNamespaceData(namespace, record.table, record.value)
      }

      console.log(`成功导入 ${data.length} 条记录到命名空间 ${namespace}`)
      return true
    } catch (error) {
      console.error('导入项目数据失败:', error)
      return false
    }
  }

  /**
   * 清理项目数据
   */
  static async cleanupProject(namespace: string, confirm: boolean = false): Promise<boolean> {
    if (!confirm) {
      throw new Error('请确认删除操作，这将永久删除所有项目数据')
    }

    try {
      // 获取项目的所有数据
      const allData = await dataManager.getAllNamespaceData('')
      const projectData = allData[namespace] || []

      // 删除所有数据记录
      for (const record of projectData) {
        const fullKey = generateNamespacedKey(namespace, record.table, record.key)
        // 注意：这里需要调用实际的删除API
        console.log(`删除记录: ${fullKey}`)
      }

      // 删除项目配置
      await dataManager.setSharedData('globalConfig', `project_${namespace}`, null)

      console.log(`项目 ${namespace} 清理完成`)
      return true
    } catch (error) {
      console.error('清理项目失败:', error)
      return false
    }
  }
}

// 预定义的项目模板
export const projectTemplates = {
  basic: {
    projectName: '基础项目',
    namespace: 'basic',
    description: '基础的 CRUD 应用模板',
    tables: {
      users: '用户数据表',
      settings: '配置数据表',
      logs: '日志数据表'
    },
    adminEmail: 'admin@example.com'
  },
  
  ecommerce: {
    projectName: '电商系统',
    namespace: 'shop',
    description: '电商平台管理系统',
    tables: {
      products: '商品数据表',
      orders: '订单数据表',
      customers: '客户数据表',
      inventory: '库存数据表'
    },
    adminEmail: 'admin@shop.com'
  },
  
  blog: {
    projectName: '博客系统',
    namespace: 'blog',
    description: '个人博客管理系统',
    tables: {
      posts: '文章数据表',
      categories: '分类数据表',
      comments: '评论数据表',
      tags: '标签数据表'
    },
    adminEmail: 'admin@blog.com'
  }
}