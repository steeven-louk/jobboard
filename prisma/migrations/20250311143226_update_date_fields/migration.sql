/*
  Warnings:

  - You are about to drop the column `date` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Formation` table. All the data in the column will be lost.
  - Made the column `date_fin` on table `Experience` required. This step will fail if there are existing NULL values in that column.
  - Made the column `date_fin` on table `Formation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Experience" DROP COLUMN "date",
ALTER COLUMN "date_fin" SET NOT NULL;

-- AlterTable
ALTER TABLE "Formation" DROP COLUMN "date",
ALTER COLUMN "date_fin" SET NOT NULL;
