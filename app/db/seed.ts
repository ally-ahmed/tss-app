import { db } from '@/db/client'
import { Post } from '@/db/schema/post'
interface JSONPlaceholderAuthor {
  id: string
  name: string
}

interface JSONPlaceholderPost {
  userId: string
  id: string
  title: string
  body: string
}

export async function seed() {
  console.log('Seeding...')
  const authors = await fetch(
    'https://jsonplaceholder.typicode.com/users',
  ).then((r) => r.json() as Promise<JSONPlaceholderAuthor[]>)

  await fetch('https://jsonplaceholder.typicode.com/posts')
    .then((r) => r.json() as Promise<JSONPlaceholderPost[]>)
    .then((posts) => posts.slice(0, 10))
    .then((posts) => {
      // TODO update seed to include user
      // return db.insert(Post).values(
      //   posts.map((post) => ({
      //     author: authors.find((a) => a.id === post.userId)?.name ?? 'John Doe',
      //     title: post.title,
      //     body: post.body,
      //   })),
      // )
    })
}

void seed().then(() => console.log('Seeded!'))
