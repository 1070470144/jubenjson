import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js'
import * as kv from './kv_store.tsx'

const app = new Hono()

// 启用 CORS 和日志
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['*'],
}))
app.use('*', logger(console.log))

// 创建 Supabase 客户端
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

// 用户角色枚举
const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  USER: 'user',
  GUEST: 'guest'
}

// 权限检查函数
async function checkUserRole(accessToken: string, requiredRoles: string[] = []) {
  if (!accessToken) {
    return { error: '未提供访问令牌', status: 401 }
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  
  if (error || !user) {
    return { error: '未授权', status: 401 }
  }

  // 从用户元数据获取角色，默认为普通用户
  const userRole = user.user_metadata?.role || USER_ROLES.USER
  
  // 如果没有指定必需角色，只验证用户存在
  if (requiredRoles.length === 0) {
    return { user, userRole, authorized: true }
  }

  // 超级管理员拥有所有权限
  if (userRole === USER_ROLES.SUPER_ADMIN) {
    return { user, userRole, authorized: true }
  }

  // 检查用户角色是否在要求的角色列表中
  const authorized = requiredRoles.includes(userRole)
  
  if (!authorized) {
    return { error: '权限不足', status: 403 }
  }

  return { user, userRole, authorized: true }
}

// 用户注册
app.post('/make-server-2f4adc16/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    
    if (!email || !password || !name) {
      return c.json({ error: '缺少必要字段：email, password, name' }, 400)
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        role: USER_ROLES.USER // 默认为普通用户角色
      },
      // 自动确认用户邮箱，因为没有配置邮件服务器
      email_confirm: true
    })

    if (error) {
      console.log('注册用户时出现错误:', error)
      return c.json({ error: error.message }, 400)
    }

    return c.json({ user: data.user, message: '注册成功' })
  } catch (error) {
    console.log('注册过程中出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 管理员创建用户
app.post('/make-server-2f4adc16/users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { email, password, name, role = USER_ROLES.USER } = await c.req.json()
    
    // 检查权限 - 只有管理员和超级管理员可以创建用户
    const authCheck = await checkUserRole(accessToken, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])
    if (authCheck.error) {
      return c.json({ error: authCheck.error }, authCheck.status)
    }
    
    if (!email || !password || !name) {
      return c.json({ error: '缺少必要字段：email, password, name' }, 400)
    }

    // 验证角色是否有效
    const validRoles = Object.values(USER_ROLES)
    if (!validRoles.includes(role)) {
      return c.json({ error: '无效的用户角色' }, 400)
    }

    // 只有超级管理员可以创建管理员和超级管理员
    if ((role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) && 
        authCheck.userRole !== USER_ROLES.SUPER_ADMIN) {
      return c.json({ error: '只有超级管理员可以创建管理员账户' }, 403)
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true
    })

    if (error) {
      console.log('创建用户时出现错误:', error)
      return c.json({ error: error.message }, 400)
    }

    return c.json({ user: data.user, message: '用户创建成功' })
  } catch (error) {
    console.log('创建用户时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 获取用户信息
app.get('/make-server-2f4adc16/user', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: '未提供访问令牌' }, 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      console.log('获取用户信息时出现授权错误:', error)
      return c.json({ error: '未授权' }, 401)
    }

    return c.json({ user })
  } catch (error) {
    console.log('获取用户信息时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 获取所有用户列表（需要管理员权限）
app.get('/make-server-2f4adc16/users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    // 检查权限 - 只有管理员和超级管理员可以查看用户列表
    const authCheck = await checkUserRole(accessToken, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])
    if (authCheck.error) {
      return c.json({ error: authCheck.error }, authCheck.status)
    }

    // 获取所有用户
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.log('获取用户列表时出现错误:', error)
      return c.json({ error: error.message }, 500)
    }

    // 处理用户数据，只返回必要的信息
    const userList = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || '未设置',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      role: user.user_metadata?.role || USER_ROLES.USER
    }))

    return c.json({ 
      users: userList,
      currentUserRole: authCheck.userRole
    })
  } catch (error) {
    console.log('获取用户列表时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 删除用户（需要管理员权限）
app.delete('/make-server-2f4adc16/users/:userId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const userId = c.req.param('userId')
    
    if (!userId) {
      return c.json({ error: '缺少用户ID' }, 400)
    }

    // 检查权限 - 只有管理员和超级管理员可以删除用户
    const authCheck = await checkUserRole(accessToken, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])
    if (authCheck.error) {
      return c.json({ error: authCheck.error }, authCheck.status)
    }

    // 防止删除自己
    if (authCheck.user.id === userId) {
      return c.json({ error: '不能删除自己的账户' }, 400)
    }

    // 获取要删除的用户信息
    const { data: targetUser, error: getUserError } = await supabase.auth.admin.getUserById(userId)
    
    if (getUserError || !targetUser.user) {
      return c.json({ error: '用户不存在' }, 404)
    }

    const targetUserRole = targetUser.user.user_metadata?.role || USER_ROLES.USER

    // 只有超级管理员可以删除管理员和超级管理员
    if ((targetUserRole === USER_ROLES.ADMIN || targetUserRole === USER_ROLES.SUPER_ADMIN) && 
        authCheck.userRole !== USER_ROLES.SUPER_ADMIN) {
      return c.json({ error: '只有超级管理员可以删除管理员账户' }, 403)
    }

    // 删除用户
    const { error } = await supabase.auth.admin.deleteUser(userId)
    
    if (error) {
      console.log('删除用户时出现错误:', error)
      return c.json({ error: error.message }, 500)
    }

    return c.json({ message: '用户删除成功' })
  } catch (error) {
    console.log('删除用户时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 更新用户信息（需要管理员权限）
app.put('/make-server-2f4adc16/users/:userId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const userId = c.req.param('userId')
    const { name, email, role } = await c.req.json()
    
    if (!userId) {
      return c.json({ error: '缺少用户ID' }, 400)
    }

    // 检查权限 - 只有管理员和超级管理员可以更新用户
    const authCheck = await checkUserRole(accessToken, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])
    if (authCheck.error) {
      return c.json({ error: authCheck.error }, authCheck.status)
    }

    // 获取要更新的用户信息
    const { data: targetUser, error: getUserError } = await supabase.auth.admin.getUserById(userId)
    
    if (getUserError || !targetUser.user) {
      return c.json({ error: '用户不存在' }, 404)
    }

    const currentUserMetadata = targetUser.user.user_metadata || {}
    const targetUserRole = currentUserMetadata.role || USER_ROLES.USER

    // 如果要更新角色
    if (role) {
      // 验证角色是否有效
      const validRoles = Object.values(USER_ROLES)
      if (!validRoles.includes(role)) {
        return c.json({ error: '无效的用户角色' }, 400)
      }

      // 只有超级管理员可以修改管理员和超级管理员的角色
      if ((targetUserRole === USER_ROLES.ADMIN || targetUserRole === USER_ROLES.SUPER_ADMIN || 
           role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) && 
          authCheck.userRole !== USER_ROLES.SUPER_ADMIN) {
        return c.json({ error: '只有超级管理员可以修改管理员角色' }, 403)
      }

      // 防止修改自己的角色为非超级管理员（如果是超级管理员的话）
      if (authCheck.user.id === userId && authCheck.userRole === USER_ROLES.SUPER_ADMIN && 
          role !== USER_ROLES.SUPER_ADMIN) {
        return c.json({ error: '不能降低自己的超级管理员权限' }, 400)
      }
    }

    // 更新用户信息
    const updateData: any = {}
    if (email) updateData.email = email
    
    // 更新用户元数据
    const updatedMetadata = { ...currentUserMetadata }
    if (name) updatedMetadata.name = name
    if (role) updatedMetadata.role = role
    updateData.user_metadata = updatedMetadata

    const { data, error } = await supabase.auth.admin.updateUserById(userId, updateData)
    
    if (error) {
      console.log('更新用户时出现错误:', error)
      return c.json({ error: error.message }, 500)
    }

    return c.json({ user: data.user, message: '用户更新成功' })
  } catch (error) {
    console.log('更新用户时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 获取可用角色列表
app.get('/make-server-2f4adc16/roles', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    // 检查权限 - 只有管理员和超级管理员可以查看角色列表
    const authCheck = await checkUserRole(accessToken, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])
    if (authCheck.error) {
      return c.json({ error: authCheck.error }, authCheck.status)
    }

    const roles = [
      { 
        value: USER_ROLES.GUEST, 
        label: '访客', 
        description: '只读权限',
        accessible: true
      },
      { 
        value: USER_ROLES.USER, 
        label: '普通用户', 
        description: '基本功能权限',
        accessible: true
      },
      { 
        value: USER_ROLES.ADMIN, 
        label: '管理员', 
        description: '用户和内容管理权限',
        accessible: authCheck.userRole === USER_ROLES.SUPER_ADMIN
      },
      { 
        value: USER_ROLES.SUPER_ADMIN, 
        label: '超级管理员', 
        description: '完全系统控制权限',
        accessible: authCheck.userRole === USER_ROLES.SUPER_ADMIN
      }
    ]

    return c.json({ 
      roles: roles.filter(role => role.accessible),
      currentUserRole: authCheck.userRole
    })
  } catch (error) {
    console.log('获取角色列表时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 获取所有数据记录
app.get('/make-server-2f4adc16/data', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: '未提供访问令牌' }, 401)
    }

    // 验证当前用户是否有权限
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      console.log('获取数据记录时出现授权错误:', authError)
      return c.json({ error: '未授权' }, 401)
    }

    // 获取所有数据记录
    const records = await kv.getByPrefix('data:')
    
    // 处理数据格式
    const formattedRecords = records.map(record => {
      const key = record.key.replace('data:', '')
      const value = record.value
      const type = getDataType(value)
      
      return {
        key,
        value,
        type,
        created_at: record.created_at || new Date().toISOString(),
        updated_at: record.updated_at || new Date().toISOString()
      }
    })

    return c.json({ records: formattedRecords })
  } catch (error) {
    console.log('获取数据记录时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 添加数据记录
app.post('/make-server-2f4adc16/data', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { key, value } = await c.req.json()
    
    if (!accessToken) {
      return c.json({ error: '未提供访问令牌' }, 401)
    }

    if (!key) {
      return c.json({ error: '缺少必要字段：key' }, 400)
    }

    // 验证当前用户是否有权限
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      console.log('添加数据记录时出现授权错误:', authError)
      return c.json({ error: '未授权' }, 401)
    }

    // 添加数据记录，使用 data: 前缀
    await kv.set(`data:${key}`, value)

    return c.json({ message: '数据添加成功', key, value })
  } catch (error) {
    console.log('添加数据记录时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 更新数据记录
app.put('/make-server-2f4adc16/data/:key', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const key = c.req.param('key')
    const { value } = await c.req.json()
    
    if (!accessToken) {
      return c.json({ error: '未提供访问令牌' }, 401)
    }

    if (!key) {
      return c.json({ error: '缺少数据键名' }, 400)
    }

    // 验证当前用户是否有权限
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      console.log('更新数据记录时出现授权错误:', authError)
      return c.json({ error: '未授权' }, 401)
    }

    // 检查记录是否存在
    const existingRecord = await kv.get(`data:${key}`)
    if (!existingRecord) {
      return c.json({ error: '数据记录不存在' }, 404)
    }

    // 更新数据记录
    await kv.set(`data:${key}`, value)

    return c.json({ message: '数据更新成功', key, value })
  } catch (error) {
    console.log('更新数据记录时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 删除数据记录
app.delete('/make-server-2f4adc16/data/:key', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const key = c.req.param('key')
    
    if (!accessToken) {
      return c.json({ error: '未提供访问令牌' }, 401)
    }

    if (!key) {
      return c.json({ error: '缺少数据键名' }, 400)
    }

    // 验证当前用户是否有权限
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      console.log('删除数据记录时出现授权错误:', authError)
      return c.json({ error: '未授权' }, 401)
    }

    // 删除数据记录
    await kv.del(`data:${key}`)

    return c.json({ message: '数据删除成功' })
  } catch (error) {
    console.log('删除数据记录时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 获取所有剧本
app.get('/make-server-2f4adc16/scripts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      return c.json({ error: '未提供访问令牌' }, 401)
    }

    // 验证当前用户是否有权限
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      console.log('获取剧本列表时出现授权错误:', authError)
      return c.json({ error: '未授权' }, 401)
    }

    // 获取所有剧本记录
    const scripts = await kv.getByPrefix('script:')
    
    // 处理数据格式
    const formattedScripts = scripts.map(record => {
      const scriptData = record.value
      return {
        id: record.key.replace('script:', ''),
        ...scriptData,
        created_at: record.created_at || new Date().toISOString(),
        updated_at: record.updated_at || new Date().toISOString()
      }
    })

    return c.json({ scripts: formattedScripts })
  } catch (error) {
    console.log('获取剧本列表时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 添加剧本
app.post('/make-server-2f4adc16/scripts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const scriptData = await c.req.json()
    
    if (!accessToken) {
      return c.json({ error: '未提供访问令牌' }, 401)
    }

    if (!scriptData.name) {
      return c.json({ error: '缺少必要字段：name' }, 400)
    }

    // 验证当前用户是否有权限
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      console.log('添加剧本时出现授权错误:', authError)
      return c.json({ error: '未授权' }, 401)
    }

    // 生成剧本ID
    const scriptId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 添加创建者信息
    const script = {
      ...scriptData,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 保存剧本记录
    await kv.set(`script:${scriptId}`, script)

    return c.json({ message: '剧本添加成功', id: scriptId, script })
  } catch (error) {
    console.log('添加剧本时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 更新剧本
app.put('/make-server-2f4adc16/scripts/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const scriptId = c.req.param('id')
    const scriptData = await c.req.json()
    
    if (!accessToken) {
      return c.json({ error: '未提供访问令牌' }, 401)
    }

    if (!scriptId) {
      return c.json({ error: '缺少剧本ID' }, 400)
    }

    // 验证当前用户是否有权限
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      console.log('更新剧本时出现授权错误:', authError)
      return c.json({ error: '未授权' }, 401)
    }

    // 检查剧本是否存在
    const existingScript = await kv.get(`script:${scriptId}`)
    if (!existingScript) {
      return c.json({ error: '剧本不存在' }, 404)
    }

    // 检查权限（只有创建者可以修改）
    if (existingScript.created_by !== user.id) {
      return c.json({ error: '无权限修改此剧本' }, 403)
    }

    // 更新剧本记录
    const updatedScript = {
      ...existingScript,
      ...scriptData,
      updated_at: new Date().toISOString()
    }

    await kv.set(`script:${scriptId}`, updatedScript)

    return c.json({ message: '剧本更新成功', script: updatedScript })
  } catch (error) {
    console.log('更新剧本时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 删除剧本
app.delete('/make-server-2f4adc16/scripts/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const scriptId = c.req.param('id')
    
    if (!accessToken) {
      return c.json({ error: '未提供访问令牌' }, 401)
    }

    if (!scriptId) {
      return c.json({ error: '缺少剧本ID' }, 400)
    }

    // 验证当前用户是否有权限
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      console.log('删除剧本时出现授权错误:', authError)
      return c.json({ error: '未授权' }, 401)
    }

    // 检查剧本是否存在
    const existingScript = await kv.get(`script:${scriptId}`)
    if (!existingScript) {
      return c.json({ error: '剧本不存在' }, 404)
    }

    // 检��权限（只有创建者可以删除）
    if (existingScript.created_by !== user.id) {
      return c.json({ error: '无权限删除此剧本' }, 403)
    }

    // 删除剧本记录
    await kv.del(`script:${scriptId}`)

    return c.json({ message: '剧本删除成功' })
  } catch (error) {
    console.log('删除剧本时出现服务器错误:', error)
    return c.json({ error: '服务器内部错误' }, 500)
  }
})

// 工具函数：获取数据类型
function getDataType(value: any): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'object') return 'json'
  return 'string'
}

// 健康检查
app.get('/make-server-2f4adc16/health', (c) => {
  return c.json({ status: 'ok', message: '服务器运行正常' })
})

Deno.serve(app.fetch)