-- AlterTable
ALTER TABLE "User" ADD COLUMN     "faculty" TEXT,
ADD COLUMN     "lecturerId" TEXT,
ADD COLUMN     "meta" JSONB,
ALTER COLUMN "country" DROP NOT NULL,
ALTER COLUMN "country" DROP DEFAULT;
