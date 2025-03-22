import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"
import prisma from "@/app/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = session.user.email
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      )
    }

    const room = await prisma.chatGroup.findUnique({
      where: { id: roomId },
      select: { userId: true }
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if the user is the owner of the room
    if (room.userId !== user.id) {
      return NextResponse.json(
        { error: "You can't delete other people's rooms" },
        { status: 403 }
      )
    }

    await prisma.chatGroup.delete({
      where: { id: roomId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting room:", error)
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const room = await prisma.chatGroup.findUnique({
      where: { id: roomId },
      select: { 
        id: true,
        title: true,
        userId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Error fetching room:", error)
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    )
  }
} 