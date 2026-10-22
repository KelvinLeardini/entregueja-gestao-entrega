import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Database file path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Couriers padrão para acesso imediato em qualquer aparelho
const SEED_COURIERS = [
  {
    id: 'courier_1',
    name: 'Carlos Silva (Carlão)',
    phone: '11991234567',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'ABC-1D23',
    vehicleModel: 'CG 160 Fan Preta',
    pixKeyType: 'PHONE',
    pixKey: '11991234567',
    accessToken: 'mb_carlao_vilaguilhermina',
    activePin: '784129',
    authPin2FA: '784129',
  },
  {
    id: 'courier_2',
    name: 'Roberto Almeida (Beto)',
    phone: '11988776655',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'BRA-2E45',
    vehicleModel: 'Titan 160 Azul',
    pixKeyType: 'CPF',
    pixKey: '34567891011',
    accessToken: 'mb_beto_vilamatilde',
    activePin: '529301',
    authPin2FA: '529301',
  },
  {
    id: 'courier_3',
    name: 'Lucas Santos',
    phone: '11977665544',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'DEF-3G67',
    vehicleModel: 'Fazer 250 Vermelha',
    pixKeyType: 'EMAIL',
    pixKey: 'lucas.motoboy@gmail.com',
    accessToken: 'mb_lucas_tatuape',
    activePin: '318492',
    authPin2FA: '318492',
  },
  {
    id: 'courier_4',
    name: 'Felipe Oliveira',
    phone: '11996554433',
    role: 'COURIER',
    isActive: true,
    vehiclePlate: 'GHI-4J89',
    vehicleModel: 'Biz 125 Branca',
    pixKeyType: 'RANDOM',
    pixKey: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    accessToken: 'mb_felipe_arturalvim',
    activePin: '904615',
    authPin2FA: '904615',
  },
];

const SEED_DELIVERIES = [
  {
    id: 'del_201',
    orderNumber: 'IFOOD-4192',
    source: 'IFOOD',
    customerName: 'Mariana Duarte',
    customerPhone: '11998765432',
    street: 'Rua Maciel Monteiro',
    number: '450',
    neighborhood: 'Artur Alvim',
    city: 'São Paulo',
    state: 'SP',
    distanceKm: 3.2,
    feeAmount: 9.0,
    status: 'DELIVERED',
    isFeePayable: true,
    courierId: 'courier_1',
    deliveredAt: new Date().toISOString(),
  },
  {
    id: 'del_203',
    orderNumber: 'IFOOD-9102',
    source: 'IFOOD',
    customerName: 'Camila Morais',
    customerPhone: '11997778899',
    street: 'Rua Astorga',
    number: '310',
    neighborhood: 'Vila Guilhermina',
    city: 'São Paulo',
    state: 'SP',
    distanceKm: 0.9,
    feeAmount: 6.0,
    status: 'IN_TRANSIT',
    isFeePayable: false,
    courierId: 'courier_1',
  },
];

let db = {
  tenants: {},
  couriers: {},
};

// Carrega dados salvos ou inicializa com sementes
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error('Error reading db.json:', e);
  }
}

// Garante que os couriers padrão sempre existam no índice
for (const sc of SEED_COURIERS) {
  if (!db.couriers[sc.accessToken]) {
    db.couriers[sc.accessToken] = {
      courier: sc,
      tenantSlug: 'hardbeerburguer',
      deliveries: SEED_DELIVERIES.filter(d => d.courierId === sc.id),
    };
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing db.json:', e);
  }
}

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

  // Se não estiver no índice de couriers, vasculha todos os tenants
  if (!match) {
    for (const [slug, tData] of Object.entries(db.tenants)) {
      if (tData && Array.isArray(tData.users)) {
        const found = tData.users.find(u => u.accessToken === token);
        if (found) {
          const courierDeliveries = Array.isArray(tData.deliveries)
            ? tData.deliveries.filter(d => d.courierId === found.id)
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
    tenantData.deliveries = tenantData.deliveries.map(d => {
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
      match.deliveries = match.deliveries.map(d => {
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
    tenantData.users = tenantData.users.map(u => {
      if (u.id === match.courier.id) {
        return { ...u, pixKeyType, pixKey };
      }
      return u;
    });
  }

  saveDb();
  res.json({ success: true });
});

// Serve arquivos estáticos do build do Vite
app.use(express.static(path.join(__dirname, 'dist')));

// SPA routing fallback para qualquer rota
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
