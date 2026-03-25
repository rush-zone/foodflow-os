/**
 * WhatsApp Business Cloud API — Meta
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
 *
 * Para ativar:
 *  1. Crie um App em https://developers.facebook.com
 *  2. Ative o produto "WhatsApp" no app
 *  3. Crie e aprove um template "boas_vindas" em pt_BR no Meta Business Manager
 *  4. Adicione as variáveis de ambiente no .env.local:
 *       NEXT_PUBLIC_WA_PHONE_ID=<seu Phone Number ID>
 *       NEXT_PUBLIC_WA_TOKEN=<seu Access Token permanente>
 *
 * Enquanto as vars não estiverem configuradas, as mensagens são
 * apenas logadas no console (modo simulação).
 */

export interface WaCustomer {
  name:  string;
  phone: string; // qualquer formato: "(24) 99995-2177" ou "24999952177"
}

/** Normaliza o número para o formato internacional do WhatsApp (DDI 55 + DDD + número) */
function toWaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

/**
 * Envia mensagem de boas-vindas ao cliente recém-cadastrado.
 * Usa o template "boas_vindas" aprovado no Meta — parâmetro: primeiro nome.
 */
export async function sendWhatsAppWelcome(customer: WaCustomer): Promise<void> {
  const phoneId = process.env.NEXT_PUBLIC_WA_PHONE_ID;
  const token   = process.env.NEXT_PUBLIC_WA_TOKEN;
  const to      = toWaPhone(customer.phone);
  const firstName = customer.name.trim().split(" ")[0];

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name:     "boas_vindas",
      language: { code: "pt_BR" },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: firstName }],
        },
      ],
    },
  };

  if (!phoneId || !token) {
    // Modo simulação — apenas loga no console
    console.info("[WhatsApp] 📲 Simulação — mensagem seria enviada:", {
      to,
      template: "boas_vindas",
      params: { firstName },
    });
    return;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[WhatsApp] Falha no envio:", err);
    } else {
      console.info("[WhatsApp] ✓ Mensagem enviada para", to);
    }
  } catch (err) {
    console.error("[WhatsApp] Erro de rede:", err);
  }
}

/**
 * Envia confirmação de pedido via WhatsApp.
 * Template sugerido: "confirmacao_pedido" com parâmetros: nome, número do pedido, total.
 */
export async function sendWhatsAppOrderConfirm(
  customer: WaCustomer,
  orderNumber: number,
  total: string
): Promise<void> {
  const phoneId = process.env.NEXT_PUBLIC_WA_PHONE_ID;
  const token   = process.env.NEXT_PUBLIC_WA_TOKEN;
  const to      = toWaPhone(customer.phone);

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name:     "confirmacao_pedido",
      language: { code: "pt_BR" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: customer.name.split(" ")[0] },
            { type: "text", text: String(orderNumber) },
            { type: "text", text: total },
          ],
        },
      ],
    },
  };

  if (!phoneId || !token) {
    console.info("[WhatsApp] 📲 Simulação — confirmação de pedido:", {
      to,
      orderNumber,
      total,
    });
    return;
  }

  try {
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[WhatsApp] Erro ao enviar confirmação:", err);
  }
}
