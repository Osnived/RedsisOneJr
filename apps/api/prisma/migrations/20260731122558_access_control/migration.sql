-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "role_modules" (
    "role_id" UUID NOT NULL,
    "module" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_modules_pkey" PRIMARY KEY ("role_id","module")
);

-- CreateTable
CREATE TABLE "role_access_audits" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "user_id" UUID,
    "reason" TEXT NOT NULL,
    "previous_modules" TEXT[],
    "new_modules" TEXT[],
    "previous_permissions" TEXT[],
    "new_permissions" TEXT[],
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_access_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_modules_module_idx" ON "role_modules"("module");

-- CreateIndex
CREATE INDEX "role_access_audits_role_id_occurred_at_idx" ON "role_access_audits"("role_id", "occurred_at");

-- CreateIndex
CREATE INDEX "roles_is_active_idx" ON "roles"("is_active");

-- AddForeignKey
ALTER TABLE "role_modules" ADD CONSTRAINT "role_modules_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_access_audits" ADD CONSTRAINT "role_access_audits_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_access_audits" ADD CONSTRAINT "role_access_audits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
