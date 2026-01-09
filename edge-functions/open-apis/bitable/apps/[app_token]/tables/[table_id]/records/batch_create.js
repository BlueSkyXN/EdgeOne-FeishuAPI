import {
  ApiError,
  authGuard,
  errorResponse,
  getRequestId,
  getTenantAccessToken,
  jsonResponse,
  safeJson,
} from '../../../../../../../lib/shared.js'

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

async function readJsonBody(request) {
  try {
    return await request.json()
  }
  catch {
    throw new ApiError(400, 'invalid_request', 'Invalid JSON body')
  }
}
