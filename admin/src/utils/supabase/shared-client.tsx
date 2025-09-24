/**
 * 共享Supabase客户端
 * 提供跨项目的数据库访问功能
 */

import { createClient } from '@supabase/supabase-js'
import { sharedSupabaseConfig, getCurrentNamespace, generateNamespacedKey, generateSharedKey, parseKey } from './shared-config'

// 创建共享的Supabase客户端实例
const supabaseUrl = sharedSupabaseConfig.primary.url
const publicAnonKey = sharedSupabaseConfig.primary.publicAnonKey

export const sharedSupabase = createClient(supabaseUrl, publicAnonKey)

/**
 * 跨项目数据访问类
 */
export class CrossProjectDataManager {
  private currentNamespace: string
  
  constructor(namespace?: string) {
    this.currentNamespace = namespace || getCurrentNamespace()
  }
  
  /**
   * 设置当前项目命名空间
   */
  setNamespace(namespace: string) {
    this.currentNamespace = namespace
  }
  
  /**
   * 获取当前命名空间的数据
   */
  async getNamespaceData(table: string, key: string, accessToken?: string): Promise<any> {
    const fullKey = generateNamespacedKey(this.currentNamespace, table, key)
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2f4adc16/data/${encodeURIComponent(fullKey)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken || publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.value
    }
    
    return null
  }
  
  /**
   * 设置当前命名空间的数据
   */
  async setNamespaceData(table: string, key: string, value: any, accessToken?: string): Promise<boolean> {
    const fullKey = generateNamespacedKey(this.currentNamespace, table, key)
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2f4adc16/data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken || publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: fullKey,
        value
      })
    })
    
    return response.ok
  }
  
  /**
   * 获取共享数据
   */
  async getSharedData(table: string, key: string): Promise<any> {
    const fullKey = generateSharedKey(table, key)
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2f4adc16/data/${encodeURIComponent(fullKey)}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.value
    }
    
    return null
  }
  
  /**
   * 设置共享数据
   */
  async setSharedData(table: string, key: string, value: any, accessToken?: string): Promise<boolean> {
    const fullKey = generateSharedKey(table, key)
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2f4adc16/data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken || publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: fullKey,
        value
      })
    })
    
    return response.ok
  }
  
  /**
   * 获取其他项目的数据（需要有适当的权限）
   */
  async getCrossProjectData(targetNamespace: string, table: string, key: string): Promise<any> {
    const fullKey = generateNamespacedKey(targetNamespace, table, key)
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2f4adc16/data/${encodeURIComponent(fullKey)}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.value
    }
    
    return null
  }
  
  /**
   * 获取所有命名空间的数据列表
   */
  async getAllNamespaceData(table: string, accessToken?: string): Promise<Record<string, any[]>> {
    const result: Record<string, any[]> = {}
    
    // 获取所有数据
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2f4adc16/data`, {
      headers: {
        'Authorization': `Bearer ${accessToken || publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      
      // 按命名空间分组
      for (const record of data.records) {
        try {
          const parsed = parseKey(record.key)
          if (parsed.table === table && !parsed.isShared) {
            if (!result[parsed.namespace]) {
              result[parsed.namespace] = []
            }
            result[parsed.namespace].push({
              key: parsed.key,
              value: record.value,
              created_at: record.created_at,
              updated_at: record.updated_at
            })
          }
        } catch (error) {
          // 忽略无法解析的key
          console.warn('无法解析key:', record.key)
        }
      }
    }
    
    return result
  }
  
  /**
   * 同步数据到其他项目
   */
  async syncToProject(targetNamespace: string, table: string, key: string, value: any): Promise<boolean> {
    const targetKey = generateNamespacedKey(targetNamespace, table, key)
    const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2f4adc16/data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: targetKey,
        value: {
          ...value,
          synced_from: this.currentNamespace,
          synced_at: new Date().toISOString()
        }
      })
    })
    
    return response.ok
  }
}

// 创建默认的数据管理器实例
export const dataManager = new CrossProjectDataManager()

// 导出便捷函数
export const getSharedData = (table: string, key: string, accessToken?: string) => dataManager.getSharedData(table, key, accessToken)
export const setSharedData = (table: string, key: string, value: any, accessToken?: string) => dataManager.setSharedData(table, key, value, accessToken)
export const getCrossProjectData = (namespace: string, table: string, key: string, accessToken?: string) => dataManager.getCrossProjectData(namespace, table, key, accessToken)
export const syncToProject = (targetNamespace: string, table: string, key: string, value: any, accessToken?: string) => dataManager.syncToProject(targetNamespace, table, key, value, accessToken)