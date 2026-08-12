-- Drop global uniques on email and matricNumber
DROP INDEX IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "User_matricNumber_key";

-- School-scoped uniqueness (same email/matric allowed at different schools)
CREATE UNIQUE INDEX "User_school_email_key" ON "User"("school", "email");
CREATE UNIQUE INDEX "User_school_matricNumber_key" ON "User"("school", "matricNumber");

-- Track which examiner created a student account
ALTER TABLE "User" ADD COLUMN "createdByExaminerId" TEXT;
CREATE INDEX "User_createdByExaminerId_idx" ON "User"("createdByExaminerId");
ALTER TABLE "User" ADD CONSTRAINT "User_createdByExaminerId_fkey" FOREIGN KEY ("createdByExaminerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_role_school_idx" ON "User"("role", "school");

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'DROPPED');
CREATE TYPE "EnrollmentSource" AS ENUM ('EXAMINER', 'BULK_UPLOAD', 'SELF_REGISTER');

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledById" TEXT,
    "source" "EnrollmentSource" NOT NULL DEFAULT 'EXAMINER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Enrollment_studentId_courseId_key" ON "Enrollment"("studentId", "courseId");
CREATE INDEX "Enrollment_courseId_status_idx" ON "Enrollment"("courseId", "status");
CREATE INDEX "Enrollment_studentId_status_idx" ON "Enrollment"("studentId", "status");

ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_enrolledById_fkey" FOREIGN KEY ("enrolledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
