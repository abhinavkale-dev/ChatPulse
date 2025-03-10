import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma"
import { NextRequest, NextResponse } from "next/server";
import { error } from "console";

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if(!session?.user) {
      return NextResponse.json({error: "Unauthorized"},{status: 401})
    }

    const rooms = await prisma.chatGroup.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json({rooms})
  }
  catch(error){
    console.error("Error fetching rooms", error)
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

    const room = await prisma.chatGroup.create({
      data: {
        userId: user.id,
        title: roomName,
        updateAt: new Date()
      }
    })
    return NextResponse.json({room})
  }
  catch(error) {
    console.error("Error creating room", error)
    return NextResponse.json({error: "Failed to create room" }, {status: 500})
  }
}