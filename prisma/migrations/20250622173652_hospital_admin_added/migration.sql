-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN     "adminId" TEXT;

-- AddForeignKey
ALTER TABLE "Hospital" ADD CONSTRAINT "Hospital_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
