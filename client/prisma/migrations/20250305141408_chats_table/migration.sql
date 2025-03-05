/*
  Warnings:

  - Added the required column `name` to the `group_users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "group_users" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "chats" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "message" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chats_createdAt_idx" ON "chats"("createdAt");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "chat_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
