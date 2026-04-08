/*
  Warnings:

  - A unique constraint covering the columns `[organizationNumber]` on the table `CompanyRecruiter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `CompanyRecruiter` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CompanyRecruiter_organizationNumber_key" ON "CompanyRecruiter"("organizationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyRecruiter_phoneNumber_key" ON "CompanyRecruiter"("phoneNumber");
