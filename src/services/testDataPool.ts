import { OrderSource, Delivery, StoreConfig, DeliveryRateRange } from '../types';
import { calculateDeliveryFee } from './feeCalculator';

export interface SampleLocation {
  street: string;
  neighborhood: string;
  postalCode: string;
  approxDistanceKm: number;
  durationMinutes: number;
}

// Pool diversificado de endereços da Zona Leste de São Paulo (partindo de Vila Guilhermina)
export const EAST_ZONE_SAMPLE_ADDRESSES: SampleLocation[] = [
  // Raio Curto (0.8km a 2.5km)
  { street: 'Rua Costa Rego', neighborhood: 'Guilhermina-Esperança', postalCode: '03541-000', approxDistanceKm: 0.9, durationMinutes: 4 },
  { street: 'Rua Astorga', neighborhood: 'Vila Guilhermina', postalCode: '03542-000', approxDistanceKm: 1.2, durationMinutes: 5 },
  { street: 'Rua Itinguçu', neighborhood: 'Vila Ré', postalCode: '03658-011', approxDistanceKm: 2.1, durationMinutes: 7 },
  { street: 'Rua Dona Matilde', neighborhood: 'Vila Matilde', postalCode: '03512-000', approxDistanceKm: 2.7, durationMinutes: 8 },
  { street: 'Rua Canto do Buriti', neighborhood: 'Patriarca', postalCode: '03554-080', approxDistanceKm: 1.8, durationMinutes: 6 },
  
  // Raio Médio (3.0km a 5.5km)
  { street: 'Rua Maciel Monteiro', neighborhood: 'Artur Alvim', postalCode: '03566-000', approxDistanceKm: 3.4, durationMinutes: 10 },
  { street: 'Av. Waldemar Carlos Pereira', neighborhood: 'Vila Matilde', postalCode: '03533-001', approxDistanceKm: 3.8, durationMinutes: 11 },
  { street: 'Rua Betari', neighborhood: 'Penha de França', postalCode: '03634-050', approxDistanceKm: 4.3, durationMinutes: 12 },
  { street: 'Av. Amador Bueno da Veiga', neighborhood: 'Penha', postalCode: '03636-000', approxDistanceKm: 4.9, durationMinutes: 14 },
  { street: 'Rua Cantagalo', neighborhood: 'Tatuapé', postalCode: '03319-000', approxDistanceKm: 5.1, durationMinutes: 14 },
  { street: 'Rua Apucarana', neighborhood: 'Tatuapé', postalCode: '03311-000', approxDistanceKm: 5.6, durationMinutes: 16 },
  
  // Raio Longo (6.0km a 12.0km)
  { street: 'Rua Coelho Lisboa', neighborhood: 'Tatuapé', postalCode: '03313-000', approxDistanceKm: 6.2, durationMinutes: 17 },
  { street: 'Rua Eleonora Cintra', neighborhood: 'Jardim Anália Franco', postalCode: '03337-000', approxDistanceKm: 6.5, durationMinutes: 18 },
  { street: 'Av. Campanella', neighborhood: 'Itaquera', postalCode: '08220-830', approxDistanceKm: 6.8, durationMinutes: 19 },
  { street: 'Rua Toledo Barbosa', neighborhood: 'Belenzinho', postalCode: '03061-000', approxDistanceKm: 7.6, durationMinutes: 21 },
  { street: 'Rua Sabbado D\'Ângelo', neighborhood: 'Itaquera', postalCode: '08210-791', approxDistanceKm: 8.2, durationMinutes: 22 },
  { street: 'Rua da Mooca', neighborhood: 'Mooca', postalCode: '03104-002', approxDistanceKm: 8.9, durationMinutes: 25 },
  { street: 'Av. Aricanduva', neighborhood: 'Aricanduva', postalCode: '03527-000', approxDistanceKm: 5.3, durationMinutes: 15 },
  { street: 'Av. Marechal Tito', neighborhood: 'São Miguel Paulista', postalCode: '08010-090', approxDistanceKm: 11.4, durationMinutes: 29 },
];

export const SAMPLE_CUSTOMERS = [
  { name: 'Lucas Mendonça', phone: '11981223344' },
  { name: 'Fernanda Lima', phone: '11972334455' },
  { name: 'Gustavo Henrique', phone: '11993445566' },
  { name: 'Carolina Castro', phone: '11984556677' },
  { name: 'Rodrigo Santoro', phone: '11975667788' },
  { name: 'Tatiane Barbosa', phone: '11996778899' },
  { name: 'Danilo Vieira', phone: '11987889900' },
  { name: 'Priscila Siqueira', phone: '11978990011' },
  { name: 'Fábio Antunes', phone: '11999001122' },
  { name: 'Renata Coimbra', phone: '11980112233' },
  { name: 'Marcelo Pires', phone: '11971223344' },
  { name: 'Bianca Nogueira', phone: '11992334455' },
];

let lastPickIndex = -1;

export function getNextDiverseLocation(): SampleLocation {
  let nextIndex: number;
  do {
    nextIndex = Math.floor(Math.random() * EAST_ZONE_SAMPLE_ADDRESSES.length);
  } while (nextIndex === lastPickIndex && EAST_ZONE_SAMPLE_ADDRESSES.length > 1);
  
  lastPickIndex = nextIndex;
  return EAST_ZONE_SAMPLE_ADDRESSES[nextIndex];
}

export function generateRandomTestDelivery(
  source: OrderSource,
  storeConfig: StoreConfig,
  rateRanges: DeliveryRateRange[]
): Delivery {
  const loc = getNextDiverseLocation();
  const customer = SAMPLE_CUSTOMERS[Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)];
  const randomNum = Math.floor(Math.random() * 850 + 40).toString();
  const randomId = Math.floor(Math.random() * 9000 + 1000);
  const prefix =
    source === 'IFOOD'
      ? 'IFOOD'
      : source === '99FOOD'
      ? '99'
      : source === 'KEETA'
      ? 'KEETA'
      : 'BALCAO';

  // Calcula taxa com base nas faixas configuradas pelo usuário
  const feeResult = calculateDeliveryFee(
    loc.approxDistanceKm,
    rateRanges,
    storeConfig.fallbackRate,
    storeConfig.extraKmRate
  );

  // Pool realista e detalhado de pedidos de delivery com adicionais, opções e notas
  interface DetailedMealPreset {
    items: {
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      options?: string[];
      notes?: string;
    }[];
    customerDeliveryFee: number;
    discountAmount: number;
    customerNotes?: string;
  }

  const SAMPLE_DETAILED_ORDERS: Record<OrderSource, DetailedMealPreset[]> = {
    IFOOD: [
      {
        items: [
          {
            name: 'Smash Duplo Cheddar Melt & Bacon',
            quantity: 1,
            unitPrice: 38.9,
            totalPrice: 38.9,
            options: [
              'Ponto da Carne: Ao Ponto',
              '+ Bacon Artesanal Crocante (R$ 5,00)',
              '+ Cebola Caramelizada Especial (R$ 3,50)',
              'Pão: Brioche Artesanal Selado',
            ],
            notes: 'Favor enviar maionese verde extra!',
          },
          {
            name: 'Batata Rústica com Alecrim e Páprica',
            quantity: 1,
            unitPrice: 19.9,
            totalPrice: 19.9,
            options: ['Molho Incluso: Maionese da Casa'],
          },
          {
            name: 'Coca-Cola Zero Lata 350ml',
            quantity: 1,
            unitPrice: 7.9,
            totalPrice: 7.9,
            options: ['Bebida Gelada: Sim'],
          },
        ],
        customerDeliveryFee: 7.99,
        discountAmount: 10.0, // Cupom iFood Clube
        customerNotes: 'Apto 42, Bloco C. Interfone 402. Deixar na portaria com o porteiro se não atender.',
      },
      {
        items: [
          {
            name: 'Combo Casal Smash Burger (2 Lanches + Batata Grande)',
            quantity: 1,
            unitPrice: 74.9,
            totalPrice: 74.9,
            options: [
              'Burger 1: Smash Salada Bacon (Ponto Bem Passado)',
              'Burger 2: Smash Cheddar Duplo (Ao Ponto)',
              'Batata: Crinkle com Cheddar Cremoso & Bacon (R$ 6,00)',
              'Bebidas: 2x Guaraná Antarctica Lata',
            ],
            notes: 'Sem picles no lanche 1, por favor.',
          },
          {
            name: 'Mini Churros com Doce de Leite Havanna (6 un)',
            quantity: 1,
            unitPrice: 18.0,
            totalPrice: 18.0,
          },
        ],
        customerDeliveryFee: 5.99,
        discountAmount: 5.0,
        customerNotes: 'Casa de portão preto ao lado da padaria. Tocar a campainha duas vezes.',
      },
      {
        items: [
          {
            name: 'Trufado Burger Especial 200g',
            quantity: 2,
            unitPrice: 42.0,
            totalPrice: 84.0,
            options: [
              'Ponto: Ao ponto para mal passado',
              'Queijo: Gouda maçaricado',
              '+ Maionese Trufada da Casa',
            ],
          },
          {
            name: 'Milkshake de Ninho com Nutella 500ml',
            quantity: 1,
            unitPrice: 24.5,
            totalPrice: 24.5,
            options: ['Chantilly: Sim', '+ Calda Extra de Nutella (R$ 4,00)'],
          },
        ],
        customerDeliveryFee: 8.5,
        discountAmount: 0.0,
        customerNotes: 'Ligar quando o motoboy estiver saindo para descer no hall do condomínio.',
      },
    ],
    '99FOOD': [
      {
        items: [
          {
            name: 'Super Combo 99Food: Smash Burger + Fritas + Refrigerante',
            quantity: 2,
            unitPrice: 32.5,
            totalPrice: 65.0,
            options: [
              'Pão: Australiano Macio',
              'Ponto: Bem Passado',
              '+ Queijo Prato em Dobro (R$ 4,00)',
              'Bebida: Coca-Cola Original 350ml',
            ],
            notes: 'Mandar guardanapos e canudos, por gentileza.',
          },
          {
            name: 'Onion Rings Crocantes (12 anéis)',
            quantity: 1,
            unitPrice: 22.0,
            totalPrice: 22.0,
            options: ['Molho: Barbecue Defumado'],
          },
        ],
        customerDeliveryFee: 6.5,
        discountAmount: 12.0, // Promoção 99Food
        customerNotes: 'Portaria principal. Entregar para dona Valéria.',
      },
    ],
    KEETA: [
      {
        items: [
          {
            name: 'Keeta Smash Clássico 160g',
            quantity: 2,
            unitPrice: 29.9,
            totalPrice: 59.8,
            options: [
              'Ponto da Carne: Ao Ponto',
              '+ Fatia de Bacon Artesanal (R$ 4,00)',
              'Salada: Alface Americana e Tomate Caqui',
            ],
            notes: 'Caprichar na maionese artesanal!',
          },
          {
            name: 'Batata Palito Tradicional Grande',
            quantity: 1,
            unitPrice: 16.5,
            totalPrice: 16.5,
          },
          {
            name: 'Suco Natural de Laranja 500ml',
            quantity: 2,
            unitPrice: 9.5,
            totalPrice: 19.0,
            options: ['Gelo e Açúcar: Sem Açúcar'],
          },
        ],
        customerDeliveryFee: 4.99,
        discountAmount: 8.0, // Cupom de Boas-vindas Keeta
        customerNotes: 'Sobrado nos fundos, interfone número 12.',
      },
    ],
    BALCAO: [
      {
        items: [
          {
            name: 'X-Bacon Especial Artesanal 180g',
            quantity: 1,
            unitPrice: 34.0,
            totalPrice: 34.0,
            options: ['Pão: Brioche', 'Ponto: Ao Ponto', '+ Ovo Estalado (R$ 3,00)'],
            notes: 'Sem cebola crua.',
          },
          {
            name: 'Porção de Fritas com Queijo e Bacon',
            quantity: 1,
            unitPrice: 26.0,
            totalPrice: 26.0,
          },
          {
            name: 'Cerveja Artesanal IPA 500ml',
            quantity: 1,
            unitPrice: 22.0,
            totalPrice: 22.0,
            options: ['Copo descartável: Sim'],
          },
        ],
        customerDeliveryFee: 6.0,
        discountAmount: 0.0,
        customerNotes: 'Pedido via WhatsApp. Cliente pediu troco para R$ 100 se for em dinheiro.',
      },
    ],
    SISTEMA_LOCAL: [
      {
        items: [
          {
            name: 'Combo Almoço Executivo Burger',
            quantity: 1,
            unitPrice: 39.9,
            totalPrice: 39.9,
            options: ['Ponto: Bem Passado', 'Acompanhamento: Fritas'],
          },
        ],
        customerDeliveryFee: 5.0,
        discountAmount: 0.0,
      },
    ],
  };

  const poolForSource = SAMPLE_DETAILED_ORDERS[source] || SAMPLE_DETAILED_ORDERS.IFOOD;
  const selectedPreset = poolForSource[Math.floor(Math.random() * poolForSource.length)];

  // Calcula valores financeiros reais
  const subtotal = selectedPreset.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const calculatedTotal = subtotal + selectedPreset.customerDeliveryFee - selectedPreset.discountAmount;

  // Monta resumo textual legível
  const itemsSummaryText = selectedPreset.items
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(' + ');

  const paymentMethods: ('ONLINE' | 'CARD' | 'CASH' | 'PIX')[] =
    source === 'IFOOD'
      ? ['ONLINE', 'ONLINE', 'CARD']
      : source === 'BALCAO'
      ? ['CARD', 'CASH', 'PIX']
      : ['ONLINE', 'CARD'];
  const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

  return {
    id: `del_plat_${Date.now()}_${randomId}`,
    orderNumber: `${prefix}-${randomId}`,
    source,
    customerName: customer.name,
    customerPhone: customer.phone,
    street: loc.street,
    number: randomNum,
    neighborhood: loc.neighborhood,
    city: storeConfig.city,
    state: storeConfig.state,
    distanceKm: loc.approxDistanceKm,
    durationMinutes: loc.durationMinutes,
    feeAmount: feeResult.fee,
    isManualOverride: false,
    status: 'PENDING', // Chega aguardando direcionamento de motoboy
    isFeePayable: true,
    paymentMethod,
    subtotal: subtotal,
    customerDeliveryFee: selectedPreset.customerDeliveryFee,
    discountAmount: selectedPreset.discountAmount,
    orderTotal: calculatedTotal,
    items: selectedPreset.items,
    itemsSummary: itemsSummaryText,
    customerNotes: selectedPreset.customerNotes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
