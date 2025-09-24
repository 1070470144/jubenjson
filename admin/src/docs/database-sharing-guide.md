# 数据库共享配置指南

本指南将帮助您在两个或多个项目之间共享同一个Supabase数据库实例，实现数据的跨项目访问和同步。

## 🎯 概述

通过我们设计的数据库共享架构，您可以：
- 在多个项目间共享用户认证
- 通过命名空间隔离不同项目的数据
- 实现跨项目的数据访问和同步
- 维护数据一致性和安全性

## 🏗️ 架构设计

### 命名空间系统
每个项目都有独立的命名空间，数据key格式为：
```
{namespace_prefix}{table_prefix}{actual_key}
```

示例：
- 血染钟楼系统：`botc_script:my-script-123`
- 第二个项目：`proj2_data:user-settings`
- 共享数据：`shared_config:global-settings`

### 数据层级结构
```
Supabase Database
├── 项目1数据 (botc_*)
│   ├── botc_script:* (剧本数据)
│   ├── botc_character:* (角色数据)
│   └── botc_user:* (用户数据)
├── 项目2数据 (proj2_*)
│   ├── proj2_data:* (通用数据)
│   └── proj2_config:* (配置数据)
└── 共享数据 (shared_*)
    ├── shared_config:* (全局配置)
    └── shared_data:* (跨项目数据)
```

## 🚀 快速开始

### 1. 配置第二个项目

在您的第二个项目中，复制以下核心文件：

#### 复制配置文件
```bash
# 复制到第二个项目的 utils/supabase/ 目录
cp utils/supabase/shared-config.tsx /path/to/project2/utils/supabase/
cp utils/supabase/shared-client.tsx /path/to/project2/utils/supabase/
cp utils/supabase/info.tsx /path/to/project2/utils/supabase/
```

#### 更新第二个项目的命名空间
在 `shared-config.tsx` 中更新 `getCurrentNamespace()` 函数：
```typescript
export function getCurrentNamespace(): string {
  return process.env.PROJECT_NAMESPACE || 'proj2' // 改为项目2的命名空间
}
```

### 2. 环境变量配置

在两个项目中都设置以下环境变量：
```env
# Supabase配置（两个项目使用相同的值）
SUPABASE_URL=https://byqofbocrdklpzzxbkfk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 项目命名空间
PROJECT_NAMESPACE=botc     # 在项目1中
PROJECT_NAMESPACE=proj2    # 在项目2中
```

### 3. 使用示例

#### 基本数据操作
```typescript
import { dataManager } from './utils/supabase/shared-client'

// 获取当前项目的数据
const scriptData = await dataManager.getNamespaceData('scripts', 'my-script-id')

// 设置当前项目的数据
await dataManager.setNamespaceData('scripts', 'my-script-id', scriptData)

// 获取共享数据
const globalConfig = await dataManager.getSharedData('globalConfig', 'theme')

// 设置共享数据
await dataManager.setSharedData('globalConfig', 'theme', 'dark')
```

#### 跨项目数据访问
```typescript
// 从项目2访问血染钟楼的剧本数据
const botcScripts = await dataManager.getCrossProjectData('botc', 'scripts', 'script-123')

// 同步数据到其他项目
await dataManager.syncToProject('proj2', 'scripts', 'shared-script', scriptData)
```

#### 批量获取数据
```typescript
// 获取所有项目的特定表数据
const allScriptData = await dataManager.getAllNamespaceData('scripts')
console.log(allScriptData)
// 输出：
// {
//   botc: [{ key: 'script1', value: {...} }],
//   proj2: [{ key: 'script2', value: {...} }]
// }
```

## 🔧 高级配置

### 自定义命名空间
您可以在 `shared-config.tsx` 中添加新的命名空间：

```typescript
export const sharedSupabaseConfig = {
  // ... 现有配置
  namespaces: {
    // ... 现有命名空间
    
    // 新项目命名空间
    newProject: {
      prefix: "new_",
      tables: {
        items: "item:",
        categories: "category:",
        orders: "order:"
      }
    }
  }
}
```

### 数据同步策略

#### 实时同步
```typescript
// 监听数据变化并同步到其他项目
const handleDataChange = async (table: string, key: string, newValue: any) => {
  // 同步到所有相关项目
  await dataManager.syncToProject('proj2', table, key, newValue)
  await dataManager.syncToProject('proj3', table, key, newValue)
}
```

#### 定时同步
```typescript
// 定期同步关键数据
setInterval(async () => {
  const criticalData = await dataManager.getNamespaceData('scripts', 'critical-config')
  if (criticalData) {
    await dataManager.setSharedData('globalConfig', 'critical-backup', criticalData)
  }
}, 60000) // 每分钟同步一次
```

### 权限控制

#### 数据访问权限
```typescript
// 在服务器端验证跨项目访问权限
const validateCrossProjectAccess = (currentUser: any, targetNamespace: string) => {
  // 检查用户是否有权限访问目标项目的数据
  const allowedNamespaces = currentUser.metadata?.allowed_namespaces || []
  return allowedNamespaces.includes(targetNamespace)
}
```

## 📊 数据管理最佳实践

### 1. 数据隔离
- 每个项目使用独立的命名空间
- 敏感数据不放在共享区域
- 定期清理过期的同步数据

### 2. 性能优化
- 使用批量操作减少API调用
- 合理使用缓存机制
- 避免频繁的跨项目数据查询

### 3. 错误处理
```typescript
try {
  const data = await dataManager.getCrossProjectData('botc', 'scripts', 'script-id')
  if (!data) {
    console.warn('跨项目数据不存在或无权限访问')
  }
} catch (error) {
  console.error('跨项目数据访问失败:', error)
  // 降级到本地数据或默认值
}
```

### 4. 数据一致性
```typescript
// 使用事务确保数据一致性
const updateWithSync = async (table: string, key: string, value: any) => {
  try {
    // 更新本地数据
    await dataManager.setNamespaceData(table, key, value)
    
    // 更新共享数据
    await dataManager.setSharedData(table, key, value)
    
    // 同步到其他项目
    await dataManager.syncToProject('proj2', table, key, value)
    
    console.log('数据同步成功')
  } catch (error) {
    console.error('数据同步失败，需要回滚:', error)
    // 实现回滚逻辑
  }
}
```

## 🔍 故障排查

### 常见问题

#### 1. 无法访问跨项目数据
- 检查命名空间配置是否正确
- 验证用户权限设置
- 确认网络连接和API端点

#### 2. 数据同步延迟
- 检查网络延迟
- 验证服务器负载
- 考虑使用消息队列

#### 3. 配置冲突
- 确保两个项目使用相同的Supabase配置
- 检查环境变量设置
- 验证命名空间不重复

### 调试工具
```typescript
// 启用调试模式
const debugDataManager = new CrossProjectDataManager()
debugDataManager.debug = true

// 查看所有命名空间数据
const allData = await debugDataManager.getAllNamespaceData('*')
console.log('所有数据:', allData)
```

## 📈 监控和维护

### 数据使用情况监控
```typescript
// 统计各命名空间的数据量
const getNamespaceStats = async () => {
  const stats = {}
  const allData = await dataManager.getAllNamespaceData('*')
  
  for (const [namespace, data] of Object.entries(allData)) {
    stats[namespace] = {
      count: data.length,
      size: JSON.stringify(data).length,
      lastUpdated: Math.max(...data.map(d => new Date(d.updated_at).getTime()))
    }
  }
  
  return stats
}
```

### 数据清理
```typescript
// 定期清理过期的同步数据
const cleanupOldSyncData = async () => {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天前
  
  // 清理逻辑
  // ...
}
```

## 🚀 部署注意事项

1. **环境变量**: 确保所有项目都配置了正确的环境变量
2. **网络配置**: 验证项目间的网络连通性
3. **安全设置**: 配置适当的CORS和权限策略
4. **监控告警**: 设置数据同步状态的监控告警

---

通过以上配置，您就可以在两个项目之间实现完整的数据库共享功能。如果遇到任何问题，请参考故障排查部分或联系技术支持。