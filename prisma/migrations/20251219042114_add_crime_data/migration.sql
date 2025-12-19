-- CreateTable
CREATE TABLE "crime_incidents" (
    "id" TEXT NOT NULL,
    "pdId" TEXT NOT NULL,
    "incidentNum" TEXT NOT NULL,
    "incidentCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "pdDistrict" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "neighborhood" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crime_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neighborhood_crime_stats" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "totalIncidents" INTEGER NOT NULL DEFAULT 0,
    "violentCrimes" INTEGER NOT NULL DEFAULT 0,
    "propertyCrimes" INTEGER NOT NULL DEFAULT 0,
    "otherCrimes" INTEGER NOT NULL DEFAULT 0,
    "categoryBreakdown" JSONB NOT NULL,
    "monthlyTrend" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "neighborhood_crime_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crime_incidents_pdId_key" ON "crime_incidents"("pdId");

-- CreateIndex
CREATE INDEX "crime_incidents_neighborhood_category_idx" ON "crime_incidents"("neighborhood", "category");

-- CreateIndex
CREATE INDEX "crime_incidents_date_idx" ON "crime_incidents"("date");

-- CreateIndex
CREATE INDEX "crime_incidents_category_idx" ON "crime_incidents"("category");

-- CreateIndex
CREATE INDEX "crime_incidents_pdDistrict_idx" ON "crime_incidents"("pdDistrict");

-- CreateIndex
CREATE UNIQUE INDEX "neighborhood_crime_stats_neighborhoodId_key" ON "neighborhood_crime_stats"("neighborhoodId");

-- AddForeignKey
ALTER TABLE "neighborhood_crime_stats" ADD CONSTRAINT "neighborhood_crime_stats_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "neighborhoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
