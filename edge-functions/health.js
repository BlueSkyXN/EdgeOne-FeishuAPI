import {
  ApiError,
  authGuard,
  errorResponse,
  getRequestId,
  getTenantAccessToken,
  getTokenExpiresInSeconds,
  jsonResponse,
} from './lib/shared.js'

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Token, X-Api-Key, X-Request-Id',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function onRequestGet({ request, env }) {
  const requestId = getRequestId(request.headers)
  try {
    const authError = authGuard(request, env, requestId)
    if (authError) return authError

    await getTenantAccessToken(env)
    const tokenExpiresIn = getTokenExpiresInSeconds()

    return jsonResponse(
      200,
      {
        request_id: requestId,
        data: {
          status: 'ok',
          token_expires_in: tokenExpiresIn,
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
