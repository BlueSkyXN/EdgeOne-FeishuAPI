const TOKEN_REFRESH_LEEWAY_SEC = 30 * 60

let memoryTokenCache = null

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Token, X-Api-Key, X-Request-Id',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function onRequestPost({ request, params, env }) {
  const requestId = getRequestId(request.headers)
  try {
    const authError = authGuard(request, env, requestId)
    if (authError) return authError

    const appToken = params?.app_token
    const tableId = params?.table_id
    if (!appToken || !tableId) {
      throw new ApiError(400, 'invalid_request', 'Missing path params', {
        field: 'app_token/table_id',
      })
    }

    const body = await readJsonBody(request)
    const record = normalizeSingleRecord(body)
    if (!record) {
      throw new ApiError(400, 'invalid_request', 'Only one record is supported', {
        field: 'records',
      })
    }

    const url = new URL(request.url)
    const queryParams = buildQueryParams(url.searchParams, env)
    const feishuBaseUrl = (env.FEISHU_BASE_URL || 'https://open.feishu.cn').replace(
      /\/+$/,
      '',
    )
    const feishuUrl =
      `${feishuBaseUrl}/open-apis/bitable/v1/apps/${appToken}` +
      `/tables/${tableId}/records/batch_create` +
      (queryParams ? `?${queryParams}` : '')

    const tenantAccessToken = await getTenantAccessToken(env)
    const feishuResponse = await fetch(feishuUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tenantAccessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ records: [record] }),
    })

    const feishuPayload = await safeJson(feishuResponse)
    if (!feishuResponse.ok || !feishuPayload || feishuPayload.code !== 0) {
      throw new ApiError(502, 'upstream_error', 'Feishu API error', {
        feishu_status: feishuResponse.status,
        feishu_code: feishuPayload ? feishuPayload.code : null,
        feishu_msg: feishuPayload ? feishuPayload.msg : null,
      })
    }

    return jsonResponse(
      200,
      {
        request_id: requestId,
        data: {
          records: feishuPayload.data && feishuPayload.data.records
            ? feishuPayload.data.records
            : [],
        },
      },
      requestId,
    )
  }
  catch (error) {
    const normalized = error instanceof ApiError
      ? error
      : new ApiError(
        500,
        'internal_error',
        'Unexpected error',
        { message: String(error && error.message ? error.message : error) },
      )
    return errorResponse(
      normalized.status,
      normalized.code,
      normalized.message,
      normalized.details,
      requestId,
    )
  }
}

function authGuard(request, env, requestId) {
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

function getAuthToken(headers) {
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

function normalizeSingleRecord(body) {
  if (!body || typeof body !== 'object') return null
  if (!Array.isArray(body.records)) return null
  if (body.records.length !== 1) return null
  const record = body.records[0]
  if (!record || typeof record !== 'object') return null
  if (!record.fields || typeof record.fields !== 'object') return null
  return { fields: record.fields }
}

function buildQueryParams(searchParams, env) {
  const params = new URLSearchParams()
  const userIdType = searchParams.get('user_id_type') || env?.DEFAULT_USER_ID_TYPE
  if (userIdType) params.set('user_id_type', userIdType)

  const clientToken = searchParams.get('client_token')
  if (clientToken) params.set('client_token', clientToken)

  const ignoreConsistency = searchParams.get('ignore_consistency_check')
  if (ignoreConsistency !== null && ignoreConsistency !== '') {
    params.set('ignore_consistency_check', ignoreConsistency)
  }

  const queryString = params.toString()
  return queryString.length ? queryString : ''
}

async function getTenantAccessToken(env) {
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

async function readJsonBody(request) {
  try {
    return await request.json()
  }
  catch {
    throw new ApiError(400, 'invalid_request', 'Invalid JSON body')
  }
}

async function safeJson(response) {
  try {
    return await response.json()
  }
  catch {
    return null
  }
}

function getRequestId(headers) {
  const existing = headers.get('X-Request-Id')
  if (existing) return existing
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `req_${crypto.randomUUID()}`
  }
  return `req_${Math.random().toString(36).slice(2, 12)}`
}

function jsonResponse(status, payload, requestId, extraHeaders = {}) {
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

function errorResponse(status, code, message, details, requestId, extraHeaders) {
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
