import { neon } from '@neondatabase/serverless'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'

let client: ReturnType<typeof neon>
let prismaClient: PrismaClient | undefined

export async function getClient() {
  if (!process.env.DATABASE_URL) {
    return undefined
  }
  if (!client) {
    client = await neon(process.env.DATABASE_URL!)
  }
  return client
}

export const prisma =
  prismaClient ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    }),
  })

prismaClient = prisma
