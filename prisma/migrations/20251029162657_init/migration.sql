-- CreateTable
CREATE TABLE "CompanyConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT '',
    "subheadline" TEXT NOT NULL DEFAULT '',
    "ctaText" TEXT NOT NULL DEFAULT 'Checkout',
    "basePlanId" TEXT NOT NULL,
    "redirectUrl" TEXT,
    "webhookUrl" TEXT,
    "allowPrefill" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "showBadges" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bump" (
    "id" TEXT NOT NULL,
    "companyConfigId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceLabel" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "badge" TEXT,
    "highlightColor" TEXT,
    "position" TEXT NOT NULL,
    "defaultSelected" BOOLEAN NOT NULL DEFAULT false,
    "sortIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bump_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookForwardLog" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookForwardLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyConfig_companyId_key" ON "CompanyConfig"("companyId");

-- CreateIndex
CREATE INDEX "CompanyConfig_companyId_idx" ON "CompanyConfig"("companyId");

-- CreateIndex
CREATE INDEX "Bump_companyConfigId_idx" ON "Bump"("companyConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "Bump_companyConfigId_sortIndex_key" ON "Bump"("companyConfigId", "sortIndex");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookForwardLog_paymentId_companyId_event_key" ON "WebhookForwardLog"("paymentId", "companyId", "event");

-- AddForeignKey
ALTER TABLE "Bump" ADD CONSTRAINT "Bump_companyConfigId_fkey" FOREIGN KEY ("companyConfigId") REFERENCES "CompanyConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
