/**
 * Gerador de Código Pix "Copia e Cola" (BR Code - Padrão Banco Central do Brasil / EMVCo)
 */

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Cálculo do Checksum CRC16 CCITT (0xFFFF)
 */
function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadOptions {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txId?: string;
  description?: string;
}

/**
 * Cria a string oficial do Pix Copia e Cola
 */
export function generatePixPayload(options: PixPayloadOptions): string {
  const {
    pixKey,
    merchantName,
    merchantCity,
    amount,
    txId = 'HAMB' + Math.floor(Math.random() * 9000 + 1000),
    description,
  } = options;

  // Normaliza textos para padrão ASCII
  const cleanKey = pixKey.trim();
  const cleanName = merchantName.slice(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanCity = merchantCity.slice(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanTxId = txId.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';

  // 26: Merchant Account Information
  let merchantAccountInfo = formatField('00', 'BR.GOV.BCB.PIX') + formatField('01', cleanKey);
  if (description) {
    const cleanDesc = description.slice(0, 40).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    merchantAccountInfo += formatField('02', cleanDesc);
  }

  const formattedAmount = amount > 0 ? amount.toFixed(2) : undefined;

  let payload =
    formatField('00', '01') + // Payload Format Indicator
    formatField('26', merchantAccountInfo) +
    formatField('52', '0000') + // Merchant Category Code
    formatField('53', '986') + // Transaction Currency (986 = BRL)
    (formattedAmount ? formatField('54', formattedAmount) : '') +
    formatField('58', 'BR') + // Country Code
    formatField('59', cleanName) + // Merchant Name
    formatField('60', cleanCity) + // Merchant City
    formatField('62', formatField('05', cleanTxId)); // Additional Data Field (txId)

  // 63: CRC16 prefix
  payload += '6304';
  const crc = calculateCRC16(payload);

  return `${payload}${crc}`;
}

/**
 * Monta o texto de recibo para envio ao WhatsApp do Motoboy
 */
export function generateWhatsAppSettlementMessage(params: {
  storeName: string;
  courierName: string;
  periodLabel: string;
  totalDeliveries: number;
  totalAmount: number;
  bonusAmount: number;
  discountAmount: number;
  finalPayout: number;
  pixKey: string;
  pixType: string;
}): string {
  const {
    storeName,
    courierName,
    periodLabel,
    totalDeliveries,
    totalAmount,
    bonusAmount,
    discountAmount,
    finalPayout,
    pixKey,
    pixType,
  } = params;

  let message = `🛵 *FECHAMENTO SEMANAL DE TAXAS - ${storeName.toUpperCase()}*\n`;
  message += `👤 Motoboy: *${courierName}*\n`;
  message += `📅 Período: *${periodLabel}*\n\n`;
  message += `📦 Total de Entregas Realizadas: *${totalDeliveries}*\n`;
  message += `💰 Subtotal de Taxas: *R$ ${totalAmount.toFixed(2).replace('.', ',')}*\n`;

  if (bonusAmount > 0) {
    message += `➕ Bônus / Ajuda de Custo: *+ R$ ${bonusAmount.toFixed(2).replace('.', ',')}*\n`;
  }
  if (discountAmount > 0) {
    message += `➖ Vales / Adiantamentos: *- R$ ${discountAmount.toFixed(2).replace('.', ',')}*\n`;
  }

  message += `\n*TOTAL LÍQUIDO A PAGAR: R$ ${finalPayout.toFixed(2).replace('.', ',')}*\n\n`;
  message += `🔑 Chave Pix cadastrada (${pixType}):\n\`${pixKey}\`\n\n`;
  message += `Obrigado pela dedicação e parceria nesta semana! 🍔⚡`;

  return message;
}
