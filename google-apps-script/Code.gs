const SHEET_ID = "1XsOKq34h8DQxYAiwb_M2zwF8_CaQ789jL2ngmEl8juM";

const HEADERS = [
  "Recebido em", "ID", "Nome", "Empresa", "Telefone", "E-mail",
  "Estrutura", "Altura (m)", "Níveis", "Carga/nível (kg)",
  "Comprimento (m)", "Largura (m)", "Frete", "CEP", "Montagem",
  "Material", "Prazo", "Observações", "Mensagem", "UTM Source",
  "UTM Medium", "UTM Campaign", "UTM Content", "UTM Term"
];

function configurarIntegracao() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Leads");
  if (!sheet) throw new Error("A aba Leads não foi encontrada.");
  validarCabecalhos(sheet);
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty("WEBHOOK_TOKEN")) {
    properties.setProperty("WEBHOOK_TOKEN", Utilities.getUuid() + Utilities.getUuid());
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const token = PropertiesService.getScriptProperties().getProperty("WEBHOOK_TOKEN");
    if (!token || !e || !e.parameter || e.parameter.token !== token) {
      return jsonResponse({ ok: false, error: "unauthorized" });
    }
    const payload = JSON.parse(e.postData.contents || "{}");
    if (!payload.leadId || !payload.name || !payload.company || !payload.phone || payload.consent !== true) {
      return jsonResponse({ ok: false, error: "invalid_request" });
    }
    lock.waitLock(15000);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Leads");
    if (!sheet) throw new Error("missing_sheet");
    validarCabecalhos(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const duplicate = sheet.getRange(2, 2, lastRow - 1, 1).createTextFinder(String(payload.leadId)).matchEntireCell(true).findNext();
      if (duplicate) return jsonResponse({ ok: true, leadId: payload.leadId });
    }
    const row = [
      payload.savedAt, payload.leadId, payload.name, payload.company, payload.phone,
      payload.email, payload.structure, payload.height, payload.levels, payload.load,
      payload.length, payload.width, payload.freight, payload.cep, payload.installation,
      payload.material, payload.urgency, payload.notes, payload.message,
      payload.utm_source, payload.utm_medium, payload.utm_campaign,
      payload.utm_content, payload.utm_term
    ].map(safeValue);
    const target = sheet.getRange(lastRow + 1, 1, 1, row.length);
    target.setNumberFormat("@");
    target.setValues([row]);
    SpreadsheetApp.flush();
    return jsonResponse({ ok: true, leadId: payload.leadId });
  } catch (error) {
    console.error(String(error));
    return jsonResponse({ ok: false, error: "storage_failed" });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function validarCabecalhos(sheet) {
  const actual = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
  if (actual.some((value, index) => value.trim() !== HEADERS[index])) {
    throw new Error("Confira os 24 cabeçalhos da aba Leads.");
  }
}

function safeValue(value) {
  const text = String(value == null ? "" : value).slice(0, 10000);
  const first = text.charAt(0);
  return "=+-@\\t\\r\\n".indexOf(first) >= 0 ? "'" + text : text;
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
