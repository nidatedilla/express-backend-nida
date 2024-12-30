/*
  Warnings:

  - Made the column `fullname` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarImage" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "coverImage" TEXT,
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "fullname" SET NOT NULL;
