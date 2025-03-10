import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        image: true,
        createdAt: true,
      },
    });

    const processedUsers = users.map(user => {
      if (!user.name && user.email) {
        return {
          ...user,
          displayName: user.email.split('@')[0]
        };
      }
      return {
        ...user,
        displayName: user.name || 'Anonymous User'
      };
    });

    return NextResponse.json({ users: processedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 