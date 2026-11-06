-- Pedidos em preparo voltam para PENDING (a etapa PREPARING deixa de existir)
UPDATE "Delivery" SET "status" = 'PENDING' WHERE "status" = 'PREPARING';

-- Renomeia o valor sem perder os dados
ALTER TYPE "DeliveryStatus" RENAME VALUE 'OUT_FOR_DELIVERY' TO 'IN_TRANSIT';

-- Recria o tipo sem PREPARING
ALTER TYPE "DeliveryStatus" RENAME TO "DeliveryStatus_old";
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
ALTER TABLE "Delivery" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Delivery" ALTER COLUMN "status" TYPE "DeliveryStatus" USING ("status"::text::"DeliveryStatus");
ALTER TABLE "Delivery" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "DeliveryStatus_old";