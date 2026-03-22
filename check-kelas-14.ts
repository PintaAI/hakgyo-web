import 'dotenv/config'
import { PrismaClient } from './app/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!
})

const prisma = new PrismaClient({ adapter })

async function checkKelas14() {
  try {
    const kelas = await prisma.kelas.findUnique({
      where: { id: 14 },
      select: {
        id: true,
        title: true,
        type: true,
        level: true,
        isPaidClass: true,
        isDraft: true,
        authorId: true,
      }
    })

    if (kelas) {
      console.log('Kelas ID 14 exists:')
      console.log(JSON.stringify(kelas, null, 2))
    } else {
      console.log('Kelas ID 14 does NOT exist in the database')
    }
  } catch (error) {
    console.error('Error checking kelas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkKelas14()
