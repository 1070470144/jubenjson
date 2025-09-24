# 数据库共享系统使用说明

## 🎯 系统概述

这是一个专为血染钟楼剧本管理系统设计的数据库共享解决方案，允许多个项目共享同一个Supabase数据库实例，同时保持数据隔离和一致性。

## 🏗️ 核心特性

### ✅ 已实现功能
- **命名空间隔离**：每个项目有独立的数据命名空间
- **共享认证**：所有项目共享用户认证系统
- **跨项目数据访问**：支持在项目间查询和同步数据
- **可视化管理界面**：提供完整的图形化管理工具
- **项目模板**：预定义的项目结构模板
- **数据导入导出**：支持项目数据的备份和迁移

### 🔧 核心组件
1. **共享配置系统** (`/utils/supabase/shared-config.tsx`)
2. **跨项目数据管理器** (`/utils/supabase/shared-client.tsx`)
3. **数据同步管理界面** (`/components/DataSyncManager.tsx`)
4. **项目设置工具** (`/components/ProjectSetup.tsx`)

## 🚀 快速开始

### 第1步：在当前项目中启用数据同步功能

系统已经集成了数据同步功能，您可以通过以下方式访问：

1. 登录系统
2. 在左侧菜单中点击 **"数据同步"**
3. 查看当前的数据同步状态

### 第2步：创建新项目配置

1. 在左侧菜单中点击 **"项目设置"**
2. 选择 **"创建项目"** 标签页
3. 填写项目信息：
   - 项目名称：例如 "电商管理系统"
   - 命名空间：例如 "shop" (只能包含字母、数字、下划线)
   - 描述：项目功能描述
   - 管理员邮箱：项目负责人邮箱
4. 添加数据表配置
5. 点击 **"创建项目"** 完成初始化

### 第3步：在第二个项目中配置数据库连接

创建项目后，系统会生成配置文件。您需要：

1. 在第二个项目中复制相关配置文件
2. 设置环境变量
3. 初始化数据管理器

## 📋 详细配置指南

### 环境变量配置

在两个项目中都需要设置以下环境变量：

```env
# 共享的Supabase配置
SUPABASE_URL=https://byqofbocrdklpzzxbkfk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 项目特定配置
PROJECT_NAMESPACE=botc    # 血染钟楼项目
# 或
PROJECT_NAMESPACE=shop    # 第二个项目
```

### 代码集成示例

在第二个项目中使用数据管理器：

```typescript
import { CrossProjectDataManager } from './utils/supabase/shared-client'

// 初始化数据管理器
const dataManager = new CrossProjectDataManager('shop') // 使用您的命名空间

// 基本数据操作
const saveData = async () => {
  await dataManager.setNamespaceData('products', 'prod-123', {
    name: '商品名称',
    price: 99.99,
    category: '电子产品'
  }, accessToken)
}

// 获取数据
const loadData = async () => {
  const product = await dataManager.getNamespaceData('products', 'prod-123', accessToken)
  console.log(product)
}

// 跨项目数据访问
const getBotcScripts = async () => {
  const scripts = await dataManager.getCrossProjectData('botc', 'scripts', 'script-123', accessToken)
  console.log('血染钟楼剧本:', scripts)
}

// 数据同步
const syncData = async () => {
  await dataManager.syncToProject('botc', 'shared_data', 'important-config', {
    message: '来自电商系统的共享配置'
  }, accessToken)
}
```

## 🎨 使用项目模板

系统提供了3个预定义模板：

### 1. 基础项目模板
- **命名空间**: `basic`
- **数据表**: users, settings, logs
- **适用场景**: 简单的CRUD应用

### 2. 电商系统模板
- **命名空间**: `shop`
- **数据表**: products, orders, customers, inventory
- **适用场景**: 电商平台管理

### 3. 博客系统模板
- **命名空间**: `blog` 
- **数据表**: posts, categories, comments, tags
- **适用场景**: 内容管理系统

使用模板：
1. 进入 **"项目设置"** → **"项目模板"**
2. 选择合适的模板
3. 点击 **"使用模板"**
4. 切换到 **"创建项目"** 完成配置

## 🔄 数据同步策略

### 实时同步
```typescript
// 当数据变化时自动同步
const handleDataChange = async (data: any) => {
  // 保存到本地
  await dataManager.setNamespaceData('products', data.id, data, accessToken)
  
  // 同步到其他项目
  await dataManager.syncToProject('warehouse', 'products', data.id, data, accessToken)
}
```

### 定时同步
```typescript
// 每小时同步关键数据
setInterval(async () => {
  const criticalData = await dataManager.getNamespaceData('settings', 'critical', accessToken)
  if (criticalData) {
    await dataManager.setSharedData('backup', 'critical', criticalData, accessToken)
  }
}, 3600000)
```

### 批量同步
```typescript
// 同步整个数据表
const syncAllProducts = async () => {
  const allData = await dataManager.getAllNamespaceData('products', accessToken)
  const myProducts = allData['shop'] || []
  
  for (const product of myProducts) {
    await dataManager.syncToProject('analytics', 'products', product.key, product.value, accessToken)
  }
}
```

## 📊 监控和维护

### 数据统计
使用数据同步管理界面查看：
- 各命名空间的数据量统计
- 同步状态和历史记录
- 跨项目数据浏览

### 数据导出备份
```typescript
// 导出项目数据
const exportData = async () => {
  const data = await ProjectSetupManager.exportProjectData('shop')
  // 保存为JSON文件或发送到备份服��
}
```

### 清理过期数据
```typescript
// 清理30天前的日志数据
const cleanup = async () => {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  // 实现清理逻辑
}
```

## 🔒 安全考虑

### 权限控制
- 每个项目只能访问自己命名空间的数据
- 跨项目访问需要适当的权限验证
- 共享数据需要谨慎设计访问策略

### 数据隔离
- 使用命名空间前缀确保数据隔离
- 敏感数据不放在共享区域
- 定期审查跨项目数据访问

## 🛠️ 故障排查

### 常见问题

#### 1. 无法创建项目
- 检查命名空间是否已存在
- 验证用户权限
- 确认网络连接

#### 2. 数据同步失败
- 检查访问令牌是否有效
- 验证目标命名空间配置
- 查看浏览器控制台错误信息

#### 3. 跨项目数据访问被拒绝
- 确认源项目和目标项目都已正确初始化
- 检查数据键名和命名空间
- 验证用户权限设置

### 调试工具
```typescript
// 启用详细日志
const debugDataManager = new CrossProjectDataManager('shop')
debugDataManager.debug = true

// 查看所有数据
const debugData = await debugDataManager.getAllNamespaceData('*', accessToken)
console.log('调试数据:', debugData)
```

## 📈 最佳实践

### 1. 命名规范
- 命名空间使用简短、描述性的名称
- 数据键使用一致的命名模式
- 避免使用特殊字符

### 2. 数据结构设计
- 保持数据结构的一致性
- 使用版本控制管理结构变更
- 预留扩展字段

### 3. 性能优化
- 合理使用缓存
- 避免频繁的跨项目查询
- 使用批量操作处理大量数据

### 4. 监控告警
- 设置数据同步状态监控
- 配置异常情况告警
- 定期检查数据一致性

## 🔮 未来规划

### 即将推出的功能
- [ ] 实时数据变更通知
- [ ] 自动数据同步策略
- [ ] 数据版本控制
- [ ] 更细粒度的权限控制
- [ ] 数据分析和洞察

### 贡献指南
如果您想为这个项目贡献代码或提出改进建议，请：
1. 查看现有的Issue和PR
2. 遵循代码规范
3. 编写测试用例
4. 更新相关文档

---

## 📞 支持和帮助

如果您在使用过程中遇到问题，可以：
1. 查看系统内置的帮助文档
2. 检查浏览器控制台的错误信息
3. 参考本文档的故障排查部分
4. 联系技术支持团队

祝您使用愉快！🎉