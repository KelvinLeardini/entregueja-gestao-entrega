import React, { useState } from 'react';
import {
  FileCode2,
  Check,
  Copy,
  Layers,
  Database,
  Route,
  Terminal,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { Delivery, User, DeliveryRateRange, StoreConfig } from '../types';

interface ScopeDocumentationViewProps {
  deliveries: Delivery[];
  couriers: User[];
  rateRanges: DeliveryRateRange[];
  storeConfig: StoreConfig;
}

export const ScopeDocumentationView: React.FC<ScopeDocumentationViewProps> = ({
  deliveries,
  couriers,
  rateRanges,
  storeConfig,
}) => {
  const [copiedPrisma, setCopiedPrisma] = useState(false);
  const [copiedOsrm, setCopiedOsrm] = useState(false);

  const prismaSchemaCode = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  COURIER
}

enum OrderSource {
  IFOOD
  KEETA
  99FOOD
  BALCAO
  SISTEMA_LOCAL
}

enum DeliveryStatus {
  PENDING
  IN_TRANSIT
  DELIVERED
  CANCELED_BEFORE_DELIVERY // Cancelado ANTES da entrega (não remunerado)
  CANCELED_AFTER_DELIVERY  // Cancelado PÓS-entrega / no local (taxa PAGA ao motoboy)
}

enum SettlementStatus {
  OPEN
  CLOSED
  PAID
}

enum PixKeyType {
  CPF
  CNPJ
  PHONE
  EMAIL
  RANDOM
}

model User {
  id            String       @id @default(uuid())
  name          String
  phone         String       @unique
  passwordHash  String
  role          Role         @default(COURIER)
  isActive      Boolean      @default(true)
  vehiclePlate  String?
  vehicleModel  String?
  pixKeyType    PixKeyType?
  pixKey        String?
  
  deliveries    Delivery[]
  settlements   WeeklySettlement[]
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([role, isActive])
}

model DeliveryRateRange {
  id            String    @id @default(uuid())
  minKm         Float
  maxKm         Float
  price         Decimal   @db.Decimal(10, 2)
  description   String?
  isActive      Boolean   @default(true)
  orderIndex    Int       @default(0)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model StoreConfig {
  id              String   @id @default(uuid())
  storeName       String   @default("Hamburgueria")
  street          String
  number          String
  neighborhood    String
  city            String
  state           String   @db.Char(2)
  latitude        Float
  longitude       Float
  fallbackRate    Decimal  @default(7.00) @db.Decimal(10, 2)
  extraKmRate     Decimal  @default(1.50) @db.Decimal(10, 2)
  maxDistanceKm   Float    @default(25.0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AddressCache {
  id              String   @id @default(uuid())
  normalizedQuery String   @unique
  latitude        Float
  longitude       Float
  distanceKm      Float
  calculatedAt    DateTime @default(now())

  @@index([normalizedQuery])
}

model Delivery {
  id                String         @id @default(uuid())
  orderNumber       String
  source            OrderSource    @default(BALCAO)
  customerName      String
  customerPhone     String?
  street            String
  number            String
  neighborhood      String
  complement        String?
  city              String         @default("São Paulo")
  state             String         @default("SP")
  postalCode        String?
  destinationLat    Float?
  destinationLng    Float?
  
  distanceKm        Float
  feeAmount         Decimal        @db.Decimal(10, 2)
  isManualOverride  Boolean        @default(false)
  overrideReason    String?

  status            DeliveryStatus @default(PENDING)
  cancellationStage String?        // "BEFORE_DELIVERY" | "AFTER_DELIVERY"
  cancellationReason String?
  isFeePayable      Boolean        @default(true) // True se DELIVERED ou CANCELED_AFTER_DELIVERY

  courierId         String?
  courier           User?          @relation(fields: [courierId], references: [id])
  
  settlementId      String?
  settlement        WeeklySettlement? @relation(fields: [settlementId], references: [id])
  
  dispatchedAt      DateTime?
  deliveredAt       DateTime?
  canceledAt        DateTime?
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  @@index([status, createdAt])
  @@index([courierId, status])
  @@index([settlementId])
}

model WeeklySettlement {
  id                String           @id @default(uuid())
  courierId         String
  courier           User             @relation(fields: [courierId], references: [id])
  
  startDate         DateTime
  endDate           DateTime
  
  totalDeliveries   Int              @default(0)
  totalAmount       Decimal          @default(0.00) @db.Decimal(10, 2)
  bonusAmount       Decimal          @default(0.00) @db.Decimal(10, 2)
  discountAmount    Decimal          @default(0.00) @db.Decimal(10, 2)
  finalPayout       Decimal          @default(0.00) @db.Decimal(10, 2)
  
  status            SettlementStatus @default(OPEN)
  pixKeySnapshot    String?
  pixTypeSnapshot   PixKeyType?
  
  paidAt            DateTime?
  paidByUserId      String?
  notes             String?

  deliveries        Delivery[]

  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  @@index([courierId, status])
  @@index([startDate, endDate])
}`;

  const osrmCode = `// Consulta ao OSRM Gratuito (Open Source Routing Machine)
export async function calculateDrivingRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
) {
  const coords = \`\${origin.longitude},\${origin.latitude};\${destination.longitude},\${destination.latitude}\`;
  const url = \`https://router.project-osrm.org/route/v1/driving/\${coords}?overview=false&alternatives=false&steps=false\`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(4500),
  });

  if (response.ok) {
    const json = await response.json();
    if (json.code === 'Ok' && json.routes?.length > 0) {
      const distanceKm = Number((json.routes[0].distance / 1000).toFixed(2));
      const durationMinutes = Math.max(3, Math.round(json.routes[0].duration / 60));
      return { distanceKm, durationMinutes };
    }
  }
  return null;
}`;

  const handleExportJson = () => {
    const dump = {
      storeConfig,
      rateRanges,
      couriers,
      deliveries,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `burger_route_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Aviso: Área do Desenvolvedor */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-700">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 block">Documentação Técnica de Arquitetura & Prisma Schema</span>
          <span className="text-[11px] text-slate-600">
            Esta aba contém a modelagem formal do banco de dados relacional (PostgreSQL/MySQL), modelos do Prisma ORM e especificações de endpoints para o desenvolvedor implantar no servidor. O atendente do caixa/balcão não precisa acessar esta tela.
          </span>
        </div>
      </div>

      {/* Banner Principal */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-slate-900">
              Escopo Técnico, Arquitetura & Prisma Schema
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Documentação completa dos entregáveis: Schema Prisma, rotas OSRM/Nominatim e guia de implementação.
          </p>
        </div>

        <button
          onClick={handleExportJson}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Exportar Dados em JSON</span>
        </button>
      </div>

      {/* Grid de Blocos Técnicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 1: Schema Prisma */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Modelagem Prisma (schema.prisma)
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(prismaSchemaCode);
                setCopiedPrisma(true);
                setTimeout(() => setCopiedPrisma(false), 2000);
              }}
              className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
            >
              {copiedPrisma ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copiedPrisma ? 'Copiado!' : 'Copiar Prisma'}</span>
            </button>
          </div>

          <pre className="p-3.5 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[460px] leading-relaxed">
            <code>{prismaSchemaCode}</code>
          </pre>
        </div>

        {/* Bloco 2: Utilitários TypeScript OSRM & Roteamento */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Função Utilitária OSRM (TypeScript)
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(osrmCode);
                setCopiedOsrm(true);
                setTimeout(() => setCopiedOsrm(false), 2000);
              }}
              className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
            >
              {copiedOsrm ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copiedOsrm ? 'Copiado!' : 'Copiar TS'}</span>
            </button>
          </div>

          <pre className="p-3.5 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[220px] leading-relaxed">
            <code>{osrmCode}</code>
          </pre>

          {/* Destaque das Regras de Negócio e Persistência */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-900 block">
              Regras de Ouro da Arquitetura:
            </span>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>
                <strong>Custo Zero Contínuo:</strong> Uso combinado de Nominatim (geocodificação) + OSRM (distância viária real), sem necessidade de Google Maps API.
              </li>
              <li>
                <strong>Regra de 1 Rota = 1 Cálculo:</strong> Coordenadas e distâncias são cacheadas em <code>AddressCache</code>. O mesmo endereço cliente nunca é recalculado duas vezes.
              </li>
              <li>
                <strong>Imutabilidade Financeira:</strong> A taxa e KM apurados no momento do lançamento ficam gravados estáticos no pedido, impedindo inconsistência no caso de alteração futura de faixas.
              </li>
              <li>
                <strong>Fechamento Semanal Integrado:</strong> Módulo com cálculo agregado, geração de código Pix oficial Banco Central (BR Code) e mensagem WhatsApp pronta.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
