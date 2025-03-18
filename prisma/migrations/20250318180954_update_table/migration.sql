-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "employeeCount" TEXT;

-- CreateIndex
CREATE INDEX "Application_jobId_idx" ON "Application"("jobId");

-- CreateIndex
CREATE INDEX "Experience_userId_idx" ON "Experience"("userId");

-- CreateIndex
CREATE INDEX "Favoris_jobId_idx" ON "Favoris"("jobId");

-- CreateIndex
CREATE INDEX "Formation_userId_idx" ON "Formation"("userId");

-- CreateIndex
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");

-- CreateIndex
CREATE INDEX "Job_userId_idx" ON "Job"("userId");
