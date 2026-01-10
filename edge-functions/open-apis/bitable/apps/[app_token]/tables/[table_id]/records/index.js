import {
  ApiError,
  authGuard,
  errorResponse,
  getRequestId,
  getTenantAccessToken,
} from '../../../../../../../lib/shared.js'

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
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

    const url = new URL(request.url)
    const feishuBaseUrl = (env.FEISHU_BASE_URL || 'https://open.feishu.cn').replace(
      /\/+$/,
      '',
    )
    const feishuUrl =
      `${feishuBaseUrl}/open-apis/bitable/v1/apps/${appToken}` +
      `/tables/${tableId}/records${url.search}`

    const tenantAccessToken = await getTenantAccessToken(env)
    const upstreamHeaders = buildUpstreamHeaders(request.headers, tenantAccessToken)
    const feishuResponse = await fetch(feishuUrl, {
      method: request.method,
      headers: upstreamHeaders,
      body: request.body,
    })

    return withProxyHeaders(feishuResponse, requestId)
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

function buildUpstreamHeaders(requestHeaders, tenantAccessToken) {
  const headers = new Headers(requestHeaders)
  headers.set('Authorization', `Bearer ${tenantAccessToken}`)
  headers.delete('Host')
  headers.delete('Content-Length')
  headers.delete('Connection')
  headers.delete('Keep-Alive')
  headers.delete('Proxy-Authenticate')
  headers.delete('Proxy-Authorization')
  headers.delete('TE')
  headers.delete('Trailer')
  headers.delete('Transfer-Encoding')
  headers.delete('Upgrade')
  headers.delete('X-Api-Token')
  headers.delete('X-Api-Key')
  return headers
}

function withProxyHeaders(response, requestId) {
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('X-Request-Id', requestId)
  return new Response(response.body, {
    status: response.status,
    headers,
  })
}
