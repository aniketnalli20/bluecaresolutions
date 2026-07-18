export function notFoundHandler(request, response) {
  response.status(404).json({
    ok: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  })
}

export function errorHandler(error, request, response, next) {
  const status = error.status || 500

  if (status >= 500) {
    console.error(error)
  }

  response.status(status).json({
    ok: false,
    message: error.message || 'Unexpected server error.',
  })
}
