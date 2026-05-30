-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "academicYear" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "studentLevel" TEXT,
    "meta" JSONB,
    "examinerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Course_examinerId_idx" ON "Course"("examinerId");

-- CreateIndex
CREATE INDEX "Course_academicYear_semester_idx" ON "Course"("academicYear", "semester");

-- CreateIndex
CREATE INDEX "Course_studentLevel_idx" ON "Course"("studentLevel");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_examinerId_fkey" FOREIGN KEY ("examinerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
