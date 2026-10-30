import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Database file path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Couriers de demonstração para acesso no ambiente demo
const SEED_COURIERS = [
  {
    id: 'demo_courier_1',
    name: 'Marcos Oliveira (Piloto Demo 1)',
    phone: '11990001111',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'DEM-0001',
    vehicleModel: 'CG 160 Fan',
    pixKeyType: 'PHONE',
    pixKey: '11990001111',
    accessToken: 'mb_demo_marcos',
    activePin: '112233',
    authPin2FA: '112233',
  },
  {
    id: 'demo_courier_2',
    name: 'Alexandre Souza (Piloto Demo 2)',
    phone: '11990002222',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'DEM-0002',
    vehicleModel: 'Titan 160',
    pixKeyType: 'CPF',
    pixKey: '12345678900',
    accessToken: 'mb_demo_alexandre',
    activePin: '223344',
    authPin2FA: '223344',
  },
  {
    id: 'demo_courier_3',
    name: 'Gabriel Santos (Piloto Demo 3)',
    phone: '11990003333',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'DEM-0003',
    vehicleModel: 'Fazer 250',
    pixKeyType: 'EMAIL',
    pixKey: 'gabriel.demo@entregueja.com.br',
    accessToken: 'mb_demo_gabriel',
    activePin: '334455',
    authPin2FA: '334455',
  },
];

const SEED_DELIVERIES = [
  {
    id: 'demo_del_1',
    orderNumber: 'IFOOD-8812',
    source: 'IFOOD',
    customerName: 'Mariana Duarte',
    customerPhone: '11998765432',
    street: 'Rua Augusta',
    number: '1420',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    state: 'SP',
    distanceKm: 1.8,
    feeAmount: 6.0,
    status: 'IN_TRANSIT',
    isFeePayable: false,
    courierId: 'demo_courier_2',
  },
  {
    id: 'demo_del_2',
    orderNumber: 'KEETA-3104',
    source: 'KEETA',
    customerName: 'Bruno Alcantara',
    customerPhone: '11991239876',
    street: 'Alameda Santos',
    number: '800',
    neighborhood: 'Cerqueira César',
    city: 'São Paulo',
    state: 'SP',
    distanceKm: 2.4,
    feeAmount: 7.5,
    status: 'DELIVERED',
    isFeePayable: true,
    courierId: 'demo_courier_2',
    deliveredAt: new Date().toISOString(),
  },
];

interface DatabaseState {
  tenants: Record<string, any>;
  couriers: Record<string, any>;
}

let db: DatabaseState = {
  tenants: {},
  couriers: {},
};

if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error('Error reading db.json:', e);
  }
}

for (const sc of SEED_COURIERS) {
  if (sc.id.startsWith('demo_')) {
    if (!db.couriers[sc.accessToken]) {
      db.couriers[sc.accessToken] = {
        courier: sc,
        tenantSlug: 'demo',
        deliveries: SEED_DELIVERIES.filter(d => d.courierId === sc.id),
      };
    }
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing db.json:', e);
  }
}

// Health check para Cloud Run e orquestradores
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. API para sincronizar estado de uma loja (Lojista salva -> Server persiste)
app.get('/api/sync/:slug', (req, res) => {
  const slug = req.params.slug.toLowerCase();
  res.json({ success: true, data: db.tenants[slug] || null });
});

app.post('/api/sync/:slug', (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const { config, users, deliveries, rateRanges } = req.body;
  db.tenants[slug] = {
    config,
    users,
    deliveries,
    rateRanges,
    updatedAt: new Date().toISOString(),
  };

  if (Array.isArray(users)) {
    for (const u of users) {
      if (u.role === 'COURIER' && u.accessToken) {
        const courierDeliveries = Array.isArray(deliveries)
          ? deliveries.filter(d => d.courierId === u.id)
          : [];

        db.couriers[u.accessToken] = {
          courier: u,
          tenantSlug: slug,
          deliveries: courierDeliveries,
        };
      }
    }
  }

  saveDb();
  res.json({ success: true });
});

// 2. API do Motoboy para carregar dados em qualquer dispositivo
app.get('/api/couriers/:token', (req, res) => {
  const token = req.params.token;
  let match = db.couriers[token];

  if (!match) {
    for (const [slug, tData] of Object.entries(db.tenants)) {
      if (tData && Array.isArray(tData.users)) {
        const found = tData.users.find((u: any) => u.accessToken === token);
        if (found) {
          const courierDeliveries = Array.isArray(tData.deliveries)
            ? tData.deliveries.filter((d: any) => d.courierId === found.id)
            : [];
          match = {
            courier: found,
            tenantSlug: slug,
            deliveries: courierDeliveries,
          };
          db.couriers[token] = match;
          break;
        }
      }
    }
  }

  if (match) {
    return res.json({
      success: true,
      courier: match.courier,
      tenantSlug: match.tenantSlug,
      deliveries: match.deliveries || [],
    });
  }

  res.status(404).json({ success: false, error: 'Motoboy não localizado para este link.' });
});

// 3. API para o motoboy confirmar entrega do celular
app.post('/api/couriers/:token/confirm/:deliveryId', (req, res) => {
  const { token, deliveryId } = req.params;
  const match = db.couriers[token];
  if (!match) return res.status(404).json({ error: 'Motoboy não localizado' });

  const tenantData = db.tenants[match.tenantSlug];
  if (tenantData && Array.isArray(tenantData.deliveries)) {
    tenantData.deliveries = tenantData.deliveries.map((d: any) => {
      if (d.id === deliveryId) {
        const now = new Date().toISOString();
        return {
          ...d,
          status: 'DELIVERED',
          isFeePayable: true,
          deliveredAt: now,
          updatedAt: now,
        };
      }
      return d;
    });

    if (Array.isArray(match.deliveries)) {
      match.deliveries = match.deliveries.map((d: any) => {
        if (d.id === deliveryId) {
          const now = new Date().toISOString();
          return {
            ...d,
            status: 'DELIVERED',
            isFeePayable: true,
            deliveredAt: now,
            updatedAt: now,
          };
        }
        return d;
      });
    }

    saveDb();
    return res.json({ success: true });
  }

  res.status(404).json({ error: 'Pedido não encontrado' });
});

// 4. API para o motoboy atualizar chave Pix do celular
app.post('/api/couriers/:token/pix', (req, res) => {
  const { token } = req.params;
  const { pixKeyType, pixKey } = req.body;
  const match = db.couriers[token];
  if (!match) return res.status(404).json({ error: 'Motoboy não localizado' });

  match.courier.pixKeyType = pixKeyType;
  match.courier.pixKey = pixKey;

  const tenantData = db.tenants[match.tenantSlug];
  if (tenantData && Array.isArray(tenantData.users)) {
    tenantData.users = tenantData.users.map((u: any) => {
      if (u.id === match.courier.id) {
        return { ...u, pixKeyType, pixKey };
      }
      return u;
    });
  }

  saveDb();
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0', allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
