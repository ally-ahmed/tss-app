import { json } from '@tanstack/start'
import { createAPIFileRoute } from '@tanstack/start/api'

export const Route = createAPIFileRoute('/api/test')({
  GET: ({ request, params }) => {
    return json({ message: 'Hello /api/test' })
  },
})
