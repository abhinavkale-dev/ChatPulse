import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma"
import { NextRequest, NextResponse } from "next/server";

const ROOM_CREATION_RATE_LIMIT = {
  MAX_ROOMS: 1,    
  TIME_WINDOW: 3600
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if(!session?.user) {
      return NextResponse.json({error: "Unauthorized"},{status: 401})
    }

    const rooms = await prisma.chatGroup.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        ChatMessage: {
          select: {
            userId: true
          }
        }
      }
    })

    const roomsWithUserCount = rooms.map(room => ({
      id: room.id,
      userId: room.userId,
      title: room.title,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      totalParticipants: new Set(room.ChatMessage.map(msg => msg.userId)).size
    }))

    return NextResponse.json({ rooms: roomsWithUserCount })
  }
  catch(error){
    console.error("Error fetching rooms:", error)
    return NextResponse.json({error: "Failed to fetch rooms"}, {status: 500})
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if(!session?.user) {
      return NextResponse.json({error: "Unauthorized"},{status: 401})
    }
    const {roomName} = await req.json()

    if(!roomName) {
      return NextResponse.json({error: "Room name is required"}, {status: 400})
    }

    const userEmail = session.user.email
    if(!userEmail) {
      return NextResponse.json({error: "User email not found in session"}, {status: 400})
    }
    const user = await prisma.user.findUnique({
      where: {email:userEmail}
    })
    if(!user) {
      return NextResponse.json({error: "User not found"}, {status: 404})
    }

    const oneHourAgo = new Date(Date.now() - ROOM_CREATION_RATE_LIMIT.TIME_WINDOW * 1000);
    
    const recentRoomsCount = await prisma.chatGroup.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    if (recentRoomsCount >= ROOM_CREATION_RATE_LIMIT.MAX_ROOMS) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded", 
          message: `You can only create ${ROOM_CREATION_RATE_LIMIT.MAX_ROOMS} room per hour. Please try again later.`
        }, 
        { status: 429 }
      );
    }

    const room = await prisma.chatGroup.create({
      data: {
        userId: user.id,
        title: roomName,
        updatedAt: new Date()
      },
      include: {
        ChatMessage: {
          select: {
            userId: true
          }
        }
      }
    })

    const formattedRoom = {
      id: room.id,
      userId: room.userId,
      title: room.title,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      totalParticipants: 0
    }

    return NextResponse.json({ room: formattedRoom })
  }
  catch(error) {
    console.error("Error creating room:", error)
    return NextResponse.json({error: "Failed to create room" }, {status: 500})
  }
}