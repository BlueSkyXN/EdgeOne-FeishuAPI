const TOKEN_REFRESH_LEEWAY_SEC = 30 * 60

let memoryTokenCache = null

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export function getTokenExpiresInSeconds() {
  if (!memoryTokenCache) return null
  const now = Math.floor(Date.now() / 1000)
  const remaining = memoryTokenCache.expire_at - now
  return remaining > 0 ? remaining : 0
}

export function authGuard(request, env, requestId) {
  const expected = env?.API_AUTH_TOKEN
  if (!expected) {
    return errorResponse(
      500,
      'internal_error',
      'Missing API auth token',
      { field: 'API_AUTH_TOKEN' },
      requestId,
    )
  }

  const provided = getAuthToken(request.headers)
  if (!provided) {
    return errorResponse(401, 'unauthorized', 'Missing credentials', null, requestId, {
      'WWW-Authenticate': 'Bearer',
    })
  }
  if (provided !== expected) {
    return errorResponse(403, 'forbidden', 'Invalid credentials', null, requestId)
  }
  return null
}

export function getAuthToken(headers) {
  const authHeader = headers.get('Authorization')
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i)
    if (match && match[1]) return match[1].trim()
  }
  const apiToken = headers.get('X-Api-Token')
  if (apiToken) return apiToken.trim()
  const apiKey = headers.get('X-Api-Key')
  if (apiKey) return apiKey.trim()
  return ''
}

export async function getTenantAccessToken(env) {
  const now = Math.floor(Date.now() / 1000)
  if (
    memoryTokenCache &&
    memoryTokenCache.expire_at - now > TOKEN_REFRESH_LEEWAY_SEC
  ) {
    return memoryTokenCache.token
  }

  const appId = env?.FEISHU_APP_ID
  const appSecret = env?.FEISHU_APP_SECRET
  if (!appId || !appSecret) {
    throw new ApiError(500, 'internal_error', 'Missing Feishu credentials', {
      field: 'FEISHU_APP_ID/FEISHU_APP_SECRET',
    })
  }

  const feishuBaseUrl = (env?.FEISHU_BASE_URL || 'https://open.feishu.cn').replace(
    /\/+$/,
    '',
  )
  const tokenUrl = `${feishuBaseUrl}/open-apis/auth/v3/tenant_access_token/internal`
  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  })
  const tokenPayload = await safeJson(tokenResponse)

  if (!tokenResponse.ok || !tokenPayload || tokenPayload.code !== 0) {
    throw new ApiError(502, 'upstream_error', 'Failed to fetch token', {
      feishu_status: tokenResponse.status,
      feishu_code: tokenPayload ? tokenPayload.code : null,
      feishu_msg: tokenPayload ? tokenPayload.msg : null,
    })
  }

  const expire = typeof tokenPayload.expire === 'number' ? tokenPayload.expire : 0
  const cacheValue = {
    token: tokenPayload.tenant_access_token,
    expire_at: now + expire,
  }

  memoryTokenCache = cacheValue
  return cacheValue.token
}

export async function safeJson(response) {
  try {
    return await response.json()
  }
  catch {
    return null
  }
}

export function getRequestId(headers) {
  const existing = headers.get('X-Request-Id')
  if (existing) return existing
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `req_${crypto.randomUUID()}`
  }
  return `req_${Math.random().toString(36).slice(2, 12)}`
}

export function jsonResponse(status, payload, requestId, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Request-Id': requestId,
      ...extraHeaders,
    },
  })
}

export function errorResponse(status, code, message, details, requestId, extraHeaders) {
  return jsonResponse(
    status,
    {
      request_id: requestId,
      error: { code, message, details },
    },
    requestId,
    extraHeaders,
  )
}
