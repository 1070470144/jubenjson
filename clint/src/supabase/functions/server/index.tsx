import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js'
import * as kv from './kv_store.tsx'
import { getDefaultCharacters } from './characters.tsx'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger(console.log))

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Initialize storage bucket
const initializeBucket = async () => {
  const bucketName = 'make-010255fd-scripts'
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
  
  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: false,
      allowedMimeTypes: ['application/json', 'image/*']
    })
    if (error) {
      console.log('Failed to create bucket:', error)
    } else {
      console.log('Storage bucket created successfully')
    }
  }
}

// Create demo user
const createDemoUser = async () => {
  try {
    const demoEmail = 'demo@bloodontheclocktower.com'
    const demoPassword = 'demo123456'
    const demoName = '演示用户'
    
    // Try to create the demo user
    const { data, error } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      user_metadata: { name: demoName },
      email_confirm: true
    })

    if (error && !error.message.includes('already registered')) {
      console.log('Failed to create demo user:', error)
      return
    }

    // Get existing user if already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email === demoEmail)
    
    const userId = data?.user?.id || existingUser?.id
    if (!userId) return

    // Check if user profile already exists
    const existingProfile = await kv.get(`user:${userId}`)
    if (existingProfile) {
      console.log('Demo user already exists and is ready')
      return
    }

    // Initialize demo user profile in KV store
    const userProfile = {
      id: userId,
      email: demoEmail,
      name: demoName,
      joinDate: new Date().toISOString(),
      scriptsCount: 0,
      totalDownloads: 0,
      totalLikes: 0,
      likedScripts: []
    }

    await kv.set(`user:${userId}`, userProfile)
    console.log('Demo user created successfully - Email: demo@bloodontheclocktower.com, Password: demo123456')
  } catch (error) {
    console.log('Error creating demo user:', error)
  }
}

// Initialize on startup
initializeBucket()
createDemoUser()

// Routes with prefix
app.get('/make-server-010255fd/health', (c) => {
  return c.json({ status: 'ok', message: 'Blood on the Clocktower Portal API' })
})

// Test KV store functionality
app.get('/make-server-010255fd/test-kv', async (c) => {
  try {
    console.log('Testing KV store functionality...')
    
    // Test set and get
    const testKey = 'test:kv:' + Date.now()
    const testValue = { message: 'Hello KV Store', timestamp: new Date().toISOString() }
    
    console.log('Setting test value:', testKey, testValue)
    await kv.set(testKey, testValue)
    
    console.log('Getting test value back...')
    const retrievedValue = await kv.get(testKey)
    
    console.log('Retrieved value:', retrievedValue)
    
    // Test scripts list
    const scriptsList = await kv.get('scripts:list')
    console.log('Current scripts list:', scriptsList)
    
    // Clean up test data
    await kv.del(testKey)
    
    return c.json({
      status: 'ok',
      kvTest: 'passed',
      testValue: retrievedValue,
      scriptsListLength: scriptsList ? scriptsList.length : 0,
      scriptsListSample: scriptsList ? scriptsList.slice(0, 3) : []
    })
  } catch (error) {
    console.log('KV test error:', error)
    return c.json({
      status: 'error',
      kvTest: 'failed',
      error: error.message
    }, 500)
  }
})

// Auth routes
app.post('/make-server-010255fd/auth/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password and name are required' }, 400)
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })

    if (error) {
      console.log('Registration error:', error)
      return c.json({ error: error.message }, 400)
    }

    // Initialize user profile in KV store
    const userProfile = {
      id: data.user.id,
      email: data.user.email,
      name,
      joinDate: new Date().toISOString(),
      scriptsCount: 0,
      totalDownloads: 0,
      totalLikes: 0,
      likedScripts: []
    }

    await kv.set(`user:${data.user.id}`, userProfile)

    return c.json({ 
      success: true,
      message: 'User registered successfully'
    })
  } catch (error) {
    console.log('Registration error:', error)
    return c.json({ error: 'Failed to register user' }, 500)
  }
})

// Upload script (requires authentication)
app.post('/make-server-010255fd/scripts', async (c) => {
  try {
    console.log('=== Upload Script Request Started ===')
    
    // Check authentication
    const authHeader = c.req.header('Authorization')
    console.log('Auth header present:', !!authHeader)
    
    const accessToken = authHeader?.split(' ')[1]
    if (!accessToken) {
      console.log('No access token provided')
      return c.json({ error: 'No access token provided' }, 401)
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError) {
      console.log('Auth error:', authError)
      return c.json({ error: 'Authentication failed: ' + authError.message }, 401)
    }
    
    if (!user?.id) {
      console.log('No user found from token')
      return c.json({ error: 'Unauthorized - Please log in to upload scripts' }, 401)
    }
    
    console.log('Authenticated user:', user.id, user.email)

    const formData = await c.req.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const version = formData.get('version') as string
    const jsonFile = formData.get('jsonFile') as File
    const imageFiles = formData.getAll('imageFiles') as File[]

    console.log('Upload request received:')
    console.log('Title:', title)
    console.log('Description:', description)
    console.log('Version:', version)
    console.log('JSON file:', jsonFile ? `${jsonFile.name} (${jsonFile.size} bytes)` : 'none')
    console.log('Image files:', imageFiles.map(f => `${f.name} (${f.size} bytes)`))

    if (!title || !jsonFile) {
      return c.json({ error: 'Title and JSON file are required' }, 400)
    }

    // Limit to maximum 3 images
    if (imageFiles.length > 3) {
      return c.json({ error: 'Maximum 3 images allowed per script' }, 400)
    }

    // Get user profile for author name
    const userProfile = await kv.get(`user:${user.id}`)
    const author = userProfile?.name || user.email || 'Unknown Author'

    const scriptId = crypto.randomUUID()
    const bucketName = 'make-010255fd-scripts'
    const uploadedFiles: string[] = []

    // Upload JSON file
    const jsonFileName = `${scriptId}/script.json`
    const { data: jsonUpload, error: jsonError } = await supabase.storage
      .from(bucketName)
      .upload(jsonFileName, jsonFile)

    if (jsonError) {
      console.log('JSON upload error:', jsonError)
      return c.json({ error: 'Failed to upload JSON file' }, 500)
    }
    uploadedFiles.push(jsonFileName)

    // Upload image files with timeout protection
    const imageUrls: string[] = []
    console.log(`Processing ${imageFiles.length} image files for script ${scriptId}`)
    
    // 串行上传图片以避免过载，并添加超时控制
    const uploadWithTimeout = async (imageFile: File, i: number): Promise<string | null> => {
      const timeoutPromise = new Promise<string | null>((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), 15000) // 15秒超时
      })
      
      const uploadPromise = (async () => {
        try {
          // 清理文件名，移除特殊字符和中文字符，保留扩展名
          const fileExtension = imageFile.name.split('.').pop() || 'jpg'
          const cleanFileName = `image-${i + 1}.${fileExtension}`
          const imageFileName = `${scriptId}/images/${cleanFileName}`
          
          console.log(`Uploading image ${i + 1}: ${imageFileName}, original: ${imageFile.name}, size: ${imageFile.size} bytes`)
          
          const { data: imageUpload, error: imageError } = await supabase.storage
            .from(bucketName)
            .upload(imageFileName, imageFile)

          if (!imageError) {
            console.log(`Successfully uploaded image ${i + 1}: ${imageFileName}`)
            return imageFileName
          } else {
            console.log(`Failed to upload image ${i + 1}: ${imageFileName}, error:`, imageError)
            return null
          }
        } catch (error) {
          console.log(`Error uploading image ${i + 1}:`, error)
          return null
        }
      })()
      
      try {
        return await Promise.race([uploadPromise, timeoutPromise])
      } catch (error) {
        console.log(`Image ${i + 1} upload timed out or failed:`, error)
        return null
      }
    }
    
    // 并行处理图片上传，提高性能
    const uploadResults: (string | null)[] = []
    
    if (imageFiles.length <= 2) {
      // 少于等于2个文件时并行上传
      const uploadPromises = imageFiles.map((file, i) => uploadWithTimeout(file, i))
      const results = await Promise.all(uploadPromises)
      uploadResults.push(...results)
    } else {
      // 超过2个文件时分批处理，每批2个
      for (let i = 0; i < imageFiles.length; i += 2) {
        const batch = imageFiles.slice(i, i + 2)
        const batchPromises = batch.map((file, batchIndex) => 
          uploadWithTimeout(file, i + batchIndex)
        )
        const batchResults = await Promise.all(batchPromises)
        uploadResults.push(...batchResults)
        
        // 批次间短暂延迟
        if (i + 2 < imageFiles.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
    uploadResults.forEach(result => {
      if (result) {
        uploadedFiles.push(result)
        imageUrls.push(result)
      }
    })
    
    console.log(`Final imageUrls array (${imageUrls.length} successful):`, imageUrls)

    // Store script metadata
    const scriptData = {
      id: scriptId,
      title,
      description,
      author,
      authorId: user.id,
      version,
      jsonPath: jsonFileName,
      imagePaths: imageUrls,
      uploadDate: new Date().toISOString(),
      downloads: 0,
      rating: 0,
      ratingCount: 0,
      likes: 0,
      likedBy: [],
      tags: []
    }

    console.log('Saving script metadata to KV store:', scriptData)
    
    try {
      await kv.set(`script:${scriptId}`, scriptData)
      console.log('Script metadata saved successfully')
    } catch (kvError) {
      console.log('Failed to save script metadata:', kvError)
      throw new Error('Failed to save script metadata: ' + kvError.message)
    }
    
    // Add to scripts list
    console.log('Adding script to scripts list')
    try {
      const scriptsList = await kv.get('scripts:list') || []
      console.log('Current scripts list length:', scriptsList.length)
      scriptsList.push(scriptId)
      await kv.set('scripts:list', scriptsList)
      console.log('Scripts list updated, new length:', scriptsList.length)
    } catch (listError) {
      console.log('Failed to update scripts list:', listError)
      throw new Error('Failed to update scripts list: ' + listError.message)
    }

    // Update user stats
    console.log('Updating user stats')
    try {
      if (userProfile) {
        userProfile.scriptsCount += 1
        await kv.set(`user:${user.id}`, userProfile)
        console.log('User stats updated, new scripts count:', userProfile.scriptsCount)
      } else {
        console.log('Warning: No user profile found to update stats')
      }
    } catch (userError) {
      console.log('Failed to update user stats:', userError)
      // This is not critical, so we don't throw an error here
    }

    console.log(`Upload completed successfully:`)
    console.log(`- Script ID: ${scriptId}`)
    console.log(`- JSON file: ${jsonFileName}`)
    console.log(`- Image files: ${imageUrls.length} uploaded`)
    console.log(`- Image paths:`, imageUrls)
    console.log('=== Upload Script Request Completed Successfully ===')

    return c.json({ 
      success: true, 
      scriptId,
      message: 'Script uploaded successfully',
      imageCount: imageUrls.length,
      imagePaths: imageUrls
    })

  } catch (error) {
    console.log('=== Upload Script Request Failed ===')
    console.log('Upload error:', error)
    console.log('Error stack:', error.stack)
    
    return c.json({ 
      error: 'Failed to upload script', 
      details: error.message,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Get all scripts
app.get('/make-server-010255fd/scripts', async (c) => {
  try {
    console.log('=== Get Scripts Request Started ===')
    
    const scriptsList = await kv.get('scripts:list') || []
    console.log('Scripts list from KV store:', scriptsList.length, 'entries')
    
    const scripts = []

    // 批量获取脚本，提高性能
    if (scriptsList.length <= 10) {
      // 少于等于10个脚本时并行获取
      const scriptKeys = scriptsList.map(id => `script:${id}`)
      try {
        const scriptValues = await kv.mget(scriptKeys)
        scriptValues.forEach((script, index) => {
          if (script) {
            scripts.push(script)
            console.log(`Loaded script: ${script.title} (${scriptsList[index]})`)
          } else {
            console.log(`Warning: Script ${scriptsList[index]} not found in KV store`)
          }
        })
      } catch (batchError) {
        console.log('Batch get failed, falling back to individual gets:', batchError)
        // 回退到单个获取
        for (const scriptId of scriptsList) {
          try {
            const script = await kv.get(`script:${scriptId}`)
            if (script) {
              scripts.push(script)
            }
          } catch (scriptError) {
            console.log(`Error loading script ${scriptId}:`, scriptError)
          }
        }
      }
    } else {
      // 超过10个脚本时分批处理
      const batchSize = 10
      for (let i = 0; i < scriptsList.length; i += batchSize) {
        const batch = scriptsList.slice(i, i + batchSize)
        const scriptKeys = batch.map(id => `script:${id}`)
        
        try {
          const scriptValues = await kv.mget(scriptKeys)
          scriptValues.forEach((script, index) => {
            if (script) {
              scripts.push(script)
              console.log(`Loaded script: ${script.title} (${batch[index]})`)
            }
          })
        } catch (batchError) {
          console.log(`Batch ${i / batchSize + 1} failed, processing individually:`, batchError)
          for (const scriptId of batch) {
            try {
              const script = await kv.get(`script:${scriptId}`)
              if (script) {
                scripts.push(script)
              }
            } catch (scriptError) {
              console.log(`Error loading script ${scriptId}:`, scriptError)
            }
          }
        }
      }
    }

    console.log(`Successfully loaded ${scripts.length} scripts`)

    // Sort by upload date (newest first)
    scripts.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())

    console.log('=== Get Scripts Request Completed ===')
    return c.json({ scripts })
  } catch (error) {
    console.log('=== Get Scripts Request Failed ===')
    console.log('Get scripts error:', error)
    console.log('Error stack:', error.stack)
    return c.json({ error: 'Failed to fetch scripts' }, 500)
  }
})

// Get single script
app.get('/make-server-010255fd/scripts/:id', async (c) => {
  try {
    const scriptId = c.req.param('id')
    const script = await kv.get(`script:${scriptId}`)
    
    if (!script) {
      return c.json({ error: 'Script not found' }, 404)
    }

    return c.json({ script })
  } catch (error) {
    console.log('Get script error:', error)
    return c.json({ error: 'Failed to fetch script' }, 500)
  }
})

// Download script files
app.get('/make-server-010255fd/scripts/:id/download', async (c) => {
  const startTime = Date.now()
  
  try {
    const scriptId = c.req.param('id')
    console.log(`Download request started for script: ${scriptId}`)
    
    const script = await kv.get(`script:${scriptId}`)
    
    if (!script) {
      console.log(`Script not found: ${scriptId}`)
      return c.json({ error: 'Script not found' }, 404)
    }

    const bucketName = 'make-010255fd-scripts'
    const downloadUrls: { [key: string]: string } = {}
    
    console.log(`Processing download for script: ${scriptId}, title: ${script.title}`)

    // Generate signed URL for JSON file
    const { data: jsonUrl, error: jsonError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(script.jsonPath, 3600) // 1 hour expiry

    if (jsonError) {
      console.log('JSON URL error:', jsonError)
      return c.json({ error: 'Failed to generate download URL' }, 500)
    }
    downloadUrls.json = jsonUrl.signedUrl

    // Generate signed URLs for image files (parallel processing)
    downloadUrls.images = []
    console.log(`Processing ${script.imagePaths.length} image paths for download:`, script.imagePaths)
    
    if (script.imagePaths.length > 0) {
      try {
        // 并行生成所有图片的签名URL，提高性能
        const imageUrlPromises = script.imagePaths.map(async (imagePath) => {
          try {
            const { data: imageUrl, error: imageError } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(imagePath, 3600)

            if (!imageError && imageUrl) {
              console.log(`Generated signed URL for: ${imagePath}`)
              return {
                path: imagePath,
                url: imageUrl.signedUrl
              }
            } else {
              console.log(`Failed to generate signed URL for: ${imagePath}, error:`, imageError)
              return null
            }
          } catch (error) {
            console.log(`Error generating signed URL for: ${imagePath}, error:`, error)
            return null
          }
        })

        // 等待所有URL生成完成
        const imageResults = await Promise.all(imageUrlPromises)
        downloadUrls.images = imageResults.filter(result => result !== null)
        
        console.log(`Successfully generated ${downloadUrls.images.length} signed URLs out of ${script.imagePaths.length} images`)
      } catch (error) {
        console.log('Error in parallel image URL generation:', error)
        // 如果并行处理失败，回退到空数组
        downloadUrls.images = []
      }
    }
    
    console.log(`Final downloadUrls.images array length:`, downloadUrls.images.length)

    // Update download count
    script.downloads += 1
    await kv.set(`script:${scriptId}`, script)

    // Update author download stats
    const authorKey = `author:${script.author}`
    const authorStats = await kv.get(authorKey)
    if (authorStats) {
      authorStats.totalDownloads += 1
      await kv.set(authorKey, authorStats)
    }

    const processingTime = Date.now() - startTime
    console.log(`Download request completed for script ${scriptId} in ${processingTime}ms`)
    
    return c.json({ 
      script,
      downloadUrls
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.log(`Download error for script ${c.req.param('id')} after ${processingTime}ms:`, error)
    return c.json({ error: 'Failed to generate download links' }, 500)
  }
})

// Like/Unlike script
app.post('/make-server-010255fd/scripts/:id/like', async (c) => {
  try {
    // Check authentication
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized - Please log in to like scripts' }, 401)
    }

    const scriptId = c.req.param('id')
    const script = await kv.get(`script:${scriptId}`)
    
    if (!script) {
      return c.json({ error: 'Script not found' }, 404)
    }

    const userProfile = await kv.get(`user:${user.id}`)
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404)
    }

    const isLiked = script.likedBy.includes(user.id)
    
    if (isLiked) {
      // Unlike the script
      script.likedBy = script.likedBy.filter((id: string) => id !== user.id)
      script.likes -= 1
      userProfile.likedScripts = userProfile.likedScripts.filter((id: string) => id !== scriptId)
    } else {
      // Like the script
      script.likedBy.push(user.id)
      script.likes += 1
      userProfile.likedScripts.push(scriptId)
    }

    await kv.set(`script:${scriptId}`, script)
    await kv.set(`user:${user.id}`, userProfile)

    return c.json({ 
      success: true,
      liked: !isLiked,
      likes: script.likes
    })
  } catch (error) {
    console.log('Like error:', error)
    return c.json({ error: 'Failed to update like status' }, 500)
  }
})

// Rate script
app.post('/make-server-010255fd/scripts/:id/rate', async (c) => {
  try {
    const scriptId = c.req.param('id')
    const { rating } = await c.req.json()
    
    if (!rating || rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400)
    }

    const script = await kv.get(`script:${scriptId}`)
    if (!script) {
      return c.json({ error: 'Script not found' }, 404)
    }

    // Update rating
    const totalRating = script.rating * script.ratingCount + rating
    script.ratingCount += 1
    script.rating = totalRating / script.ratingCount

    await kv.set(`script:${scriptId}`, script)

    return c.json({ 
      success: true,
      newRating: script.rating,
      ratingCount: script.ratingCount
    })
  } catch (error) {
    console.log('Rating error:', error)
    return c.json({ error: 'Failed to rate script' }, 500)
  }
})

// Get user liked scripts
app.get('/make-server-010255fd/user/liked', async (c) => {
  try {
    // Check authentication
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userProfile = await kv.get(`user:${user.id}`)
    if (!userProfile || !userProfile.likedScripts) {
      return c.json({ likedScripts: [] })
    }

    return c.json({ likedScripts: userProfile.likedScripts })
  } catch (error) {
    console.log('Get user liked scripts error:', error)
    return c.json({ error: 'Failed to fetch liked scripts' }, 500)
  }
})

// Get user favorite scripts with full details
app.get('/make-server-010255fd/user/favorites', async (c) => {
  try {
    // Check authentication
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized - Please log in to view favorites' }, 401)
    }

    const userProfile = await kv.get(`user:${user.id}`)
    if (!userProfile || !userProfile.likedScripts || userProfile.likedScripts.length === 0) {
      return c.json({ favoriteScripts: [] })
    }

    console.log(`Fetching ${userProfile.likedScripts.length} favorite scripts for user ${user.id}`)

    // Get full script details for each favorite
    const favoriteScripts = []
    for (const scriptId of userProfile.likedScripts) {
      const script = await kv.get(`script:${scriptId}`)
      if (script) {
        favoriteScripts.push(script)
      }
    }

    // Sort by upload date (newest first)
    favoriteScripts.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())

    console.log(`Successfully fetched ${favoriteScripts.length} favorite scripts`)

    return c.json({ favoriteScripts })
  } catch (error) {
    console.log('Get user favorite scripts error:', error)
    return c.json({ error: 'Failed to fetch favorite scripts' }, 500)
  }
})

// Get rankings
app.get('/make-server-010255fd/rankings', async (c) => {
  try {
    const type = c.req.query('type') || 'scripts'
    
    if (type === 'scripts') {
      const scriptsList = await kv.get('scripts:list') || []
      const scripts = []

      for (const scriptId of scriptsList) {
        const script = await kv.get(`script:${scriptId}`)
        if (script) {
          scripts.push(script)
        }
      }

      const sortBy = c.req.query('sortBy') || 'downloads'
      
      // Sort scripts
      if (sortBy === 'likes') {
        scripts.sort((a, b) => b.likes - a.likes)
      } else if (sortBy === 'rating') {
        scripts.sort((a, b) => b.rating - a.rating)
      } else {
        scripts.sort((a, b) => b.downloads - a.downloads)
      }
      
      return c.json({ 
        rankings: scripts.slice(0, 10).map((script, index) => ({
          rank: index + 1,
          ...script
        }))
      })
    } else if (type === 'authors') {
      const users = await kv.getByPrefix('user:')
      
      // Sort by script count
      users.sort((a, b) => b.scriptsCount - a.scriptsCount)
      
      return c.json({
        rankings: users.slice(0, 10).map((user, index) => ({
          rank: index + 1,
          name: user.name,
          scriptsCount: user.scriptsCount,
          totalDownloads: user.totalDownloads,
          totalLikes: user.totalLikes || 0,
          joinDate: user.joinDate
        }))
      })
    }

    return c.json({ error: 'Invalid ranking type' }, 400)
  } catch (error) {
    console.log('Rankings error:', error)
    return c.json({ error: 'Failed to fetch rankings' }, 500)
  }
})

// Get characters for script generation
app.get('/make-server-010255fd/characters', async (c) => {
  try {
    // Check if we have characters cached
    let characters = await kv.get('characters:list')
    
    if (!characters) {
      // Create default character set for Blood on the Clocktower
      characters = getDefaultCharacters()
      
      // Cache the characters
      await kv.set('characters:list', characters)
      console.log('Characters cached successfully')
    }
    
    return c.json({ 
      characters,
      total: characters.length,
      byTeam: {
        townsfolk: characters.filter(c => c.team === 'townsfolk').length,
        outsider: characters.filter(c => c.team === 'outsider').length,
        minion: characters.filter(c => c.team === 'minion').length,
        demon: characters.filter(c => c.team === 'demon').length
      }
    })
  } catch (error) {
    console.log('Characters error:', error)
    return c.json({ error: 'Failed to fetch characters' }, 500)
  }
})

// Get statistics
app.get('/make-server-010255fd/stats', async (c) => {
  try {
    const scriptsList = await kv.get('scripts:list') || []
    const scripts = []
    let totalDownloads = 0

    for (const scriptId of scriptsList) {
      const script = await kv.get(`script:${scriptId}`)
      if (script) {
        scripts.push(script)
        totalDownloads += script.downloads
      }
    }

    const authors = await kv.getByPrefix('user:')
    const avgRating = scripts.length > 0 
      ? scripts.reduce((sum, s) => sum + s.rating, 0) / scripts.length 
      : 0

    return c.json({
      totalScripts: scripts.length,
      totalDownloads,
      averageRating: avgRating,
      totalAuthors: authors.length
    })
  } catch (error) {
    console.log('Stats error:', error)
    return c.json({ error: 'Failed to fetch statistics' }, 500)
  }
})

Deno.serve(app.fetch)