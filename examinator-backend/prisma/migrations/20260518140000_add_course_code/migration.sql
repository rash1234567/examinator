-- AlterTable: add courseCode (backfill existing rows, then enforce NOT NULL + unique per examiner)
ALTER TABLE "Course" ADD COLUMN "courseCode" TEXT;

UPDATE "Course"
SET "courseCode" = UPPER('LEGACY-' || REPLACE("id"::text, '-', ''))
WHERE "courseCode" IS NULL;

ALTER TABLE "Course" ALTER COLUMN "courseCode" SET NOT NULL;

CREATE UNIQUE INDEX "Course_examinerId_courseCode_key" ON "Course"("examinerId", "courseCode");
