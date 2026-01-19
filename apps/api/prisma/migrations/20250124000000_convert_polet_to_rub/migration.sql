-- Convert Polet money fields from generic Int to explicit RUB Int fields
-- Assuming existing data is already in RUB (if it was in cents, we'd divide by 100)

-- Step 1: Add new RUB columns to polet table
ALTER TABLE "polet" ADD COLUMN "cenaPoletaRub" INTEGER;
ALTER TABLE "polet" ADD COLUMN "dostavkaRub" INTEGER;
ALTER TABLE "polet" ADD COLUMN "prochieRashodyRub" INTEGER DEFAULT 0;
ALTER TABLE "polet" ADD COLUMN "obshayaSummaRub" INTEGER;

-- Step 2: Migrate existing data (assuming values are already in RUB)
UPDATE "polet" SET 
  "cenaPoletaRub" = "cenaPoleta",
  "dostavkaRub" = "dostavka",
  "prochieRashodyRub" = COALESCE("prochieRashody", 0),
  "obshayaSummaRub" = "obshayaSumma"
WHERE "cenaPoletaRub" IS NULL;

-- Step 3: Make new columns NOT NULL
ALTER TABLE "polet" ALTER COLUMN "cenaPoletaRub" SET NOT NULL;
ALTER TABLE "polet" ALTER COLUMN "dostavkaRub" SET NOT NULL;
ALTER TABLE "polet" ALTER COLUMN "obshayaSummaRub" SET NOT NULL;

-- Step 4: Add new RUB columns to poziciya_poleta table
ALTER TABLE "poziciya_poleta" ADD COLUMN "sebestoimostBazovayaRub" INTEGER DEFAULT 0;
ALTER TABLE "poziciya_poleta" ADD COLUMN "sebestoimostDostavkaRub" INTEGER DEFAULT 0;
ALTER TABLE "poziciya_poleta" ADD COLUMN "sebestoimostItogoRub" INTEGER DEFAULT 0;

-- Step 5: Migrate existing data for poziciya_poleta
-- sebestoimostNaEd becomes sebestoimostItogoRub (total cost per unit)
UPDATE "poziciya_poleta" SET 
  "sebestoimostItogoRub" = COALESCE("sebestoimostNaEd", 0)
WHERE "sebestoimostItogoRub" = 0 AND "sebestoimostNaEd" IS NOT NULL;

-- Step 6: Drop old columns from polet
ALTER TABLE "polet" DROP COLUMN "cenaPoleta";
ALTER TABLE "polet" DROP COLUMN "dostavka";
ALTER TABLE "polet" DROP COLUMN "prochieRashody";
ALTER TABLE "polet" DROP COLUMN "obshayaSumma";

-- Step 7: Drop old column from poziciya_poleta
ALTER TABLE "poziciya_poleta" DROP COLUMN "sebestoimostNaEd";

