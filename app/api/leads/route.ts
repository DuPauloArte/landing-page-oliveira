import { env } from "cloudflare:workers";

const WHATSAPP_NUMBER = "5543988440706";
type Lead = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

function buildMessage(lead: Lead) {
  const freight = text(lead.freight);
  const installation = text(lead.installation);
  const observation = [text(lead.urgency), text(lead.notes)].filter(Boolean).join(" — ");
  return [
    "Olá, vim pelo site e gostaria de um orçamento customizado:", "",
    `1. ${text(lead.structure)} com ${text(lead.height)}m de Altura`,
    `2. ${text(lead.levels)} níveis por módulo`,
    `3. Carga: ${text(lead.load)} Kg por nível`,
    `4. Área livre: ${text(lead.length)}m comp. x ${text(lead.width)}m larg.`,
    `5. Logística: ${freight}${freight === "Com frete" ? ` (CEP: ${text(lead.cep)})` : ""} | ${installation}`,
    `6. Material a armazenar: ${text(lead.material)}`,
    `7. Observação: ${observation || "Sem observações"}`,
    `Meu nome é ${text(lead.name)} da empresa ${text(lead.company)}. Contato: ${text(lead.phone)}`,
  ].join("\n");
}

function validate(lead: Lead) {
  const required = ["structure", "height", "levels", "load", "length", "width", "freight", "installation", "material", "urgency", "name", "company", "phone"];
  return required.every((field) => text(lead[field])) && lead.consent === true;
}

export async function POST(request: Request) {
  try {
    const lead = await request.json() as Lead;
    if (!validate(lead)) return Response.json({ error: "Revise os campos obrigatórios." }, { status: 400 });

    const webhookUrl = env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!webhookUrl) return Response.json({ error: "A integração com a planilha ainda está sendo configurada. Tente novamente em breve." }, { status: 503 });

    const message = buildMessage(lead);
    const leadId = crypto.randomUUID();
    const savedAt = new Date().toISOString();
    // Apps Script persists the row and then answers through a Google redirect.
    // Do not follow it: the final Googleusercontent response is not JSON and can
    // leave the browser waiting even though the lead has already been saved.
    const sheetResponse = await fetch(webhookUrl, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, savedAt, message, ...lead }), redirect: "manual",
    });
    const redirectedByAppsScript = sheetResponse.status >= 300 && sheetResponse.status < 400;
    if (!sheetResponse.ok && !redirectedByAppsScript) {
      throw new Error(`Google Sheets respondeu com status ${sheetResponse.status}`);
    }

    if (!redirectedByAppsScript) {
      const result = await sheetResponse.json().catch(() => null) as { ok?: boolean } | null;
      if (!result?.ok) throw new Error("O registro na planilha não foi confirmado.");
    }

    return Response.json({ leadId, whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}` }, { status: 201 });
  } catch (error) {
    console.error("Lead submission failed", error);
    return Response.json({ error: "Não conseguimos salvar sua solicitação agora. Seus dados continuam no formulário; tente novamente." }, { status: 502 });
  }
}
