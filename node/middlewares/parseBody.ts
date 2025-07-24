const getRawBody = require('raw-body')

export default async function parseRawBody(ctx: Context, next: () => Promise<unknown>) {
  const req = ctx.req

  if (ctx.body) {
    return next()
  }

  const raw = await getRawBody(req, {
    encoding: true,
  })

  try {
    ctx.body = JSON.parse(raw)
  } catch (err) {
    ctx.body = {}
    console.error('Erro ao fazer parse do body:', err)
  }

  await next()
}
