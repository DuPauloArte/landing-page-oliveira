"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, LoaderCircle, MessageCircle, PackageOpen, PanelsTopLeft, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type QuoteData = {
  structure: string; height: string; levels: string; load: string;
  length: string; width: string; freight: string; cep: string;
  installation: string; material: string; urgency: string; notes: string;
  name: string; company: string; phone: string; email: string; consent: boolean;
};

const initialData: QuoteData = {
  structure: "", height: "", levels: "", load: "", length: "", width: "",
  freight: "", cep: "", installation: "", material: "", urgency: "", notes: "",
  name: "", company: "", phone: "", email: "", consent: false,
};

const stepMeta = [
  ["Qual estrutura você precisa?", "Comece pelo tipo e pelas medidas principais."],
  ["Como será a configuração?", "Esses dados ajudam na avaliação técnica inicial."],
  ["Qual é o espaço disponível?", "Informe as medidas livres para instalação."],
  ["Frete, montagem e operação", "Conte como a estrutura será utilizada."],
  ["Para quem enviaremos a proposta?", "Falta pouco. Revise seus dados de contato."],
] as const;

const structureOptions = [
  { value: "Porta-paletes", label: "Porta-paletes", icon: Warehouse },
  { value: "Mini Porta-Paletes", label: "Mini Porta-Paletes", icon: PanelsTopLeft },
  { value: "Sliders", label: "Sliders", icon: PackageOpen },
  { value: "Ainda não sei", label: "Ainda não sei", icon: MessageCircle },
];

function digits(value: string) { return value.replace(/\D/g, ""); }
function formatCep(value: string) {
  const raw = digits(value).slice(0, 8);
  return raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
}

export function QuoteForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<QuoteData>(initialData);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const progress = ((step + 1) / stepMeta.length) * 100;
  const [title, subtitle] = stepMeta[step];

  useEffect(() => {
    const controller = new AbortController();
    const modelContext = (document as Document & {
      modelContext?: { registerTool: (tool: unknown, options?: { signal: AbortSignal }) => void | Promise<void> };
    }).modelContext;
    if (!modelContext?.registerTool) return () => controller.abort();

    void Promise.resolve(modelContext.registerTool({
      name: "prepare_quote_request",
      title: "Preparar solicitação de orçamento",
      description: "Preenche os dados técnicos conhecidos no formulário da Oliveira Estruturas sem enviar a solicitação.",
      inputSchema: {
        type: "object",
        properties: {
          structure: { type: "string", enum: ["Porta-paletes", "Mini Porta-Paletes", "Sliders", "Ainda não sei"] },
          height: { type: "string" }, levels: { type: "string" }, load: { type: "string" },
          length: { type: "string" }, width: { type: "string" }, material: { type: "string" },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const values = input && typeof input === "object" ? input as Partial<QuoteData> : {};
        const allowed = ["structure", "height", "levels", "load", "length", "width", "material"] as const;
        const validStructures = structureOptions.map((option) => option.value);
        if (values.structure !== undefined && !validStructures.includes(values.structure)) {
          throw new Error("structure must be one of the supported options");
        }
        for (const key of allowed) {
          if (values[key] !== undefined && typeof values[key] !== "string") throw new Error(`${key} must be a string`);
        }
        setData((current) => {
          const next = { ...current };
          for (const key of allowed) if (typeof values[key] === "string") next[key] = values[key];
          return next;
        });
        setStep(0);
        setError("");
        return { status: "prepared", nextAction: "Revise os dados e continue pelo formulário visível." };
      },
    }, { signal: controller.signal })).catch(() => undefined);

    return () => controller.abort();
  }, []);

  const summary = useMemo(() => [
    `${data.structure || "Estrutura"}${data.height ? ` com ${data.height} m de altura` : ""}`,
    `${data.levels || "—"} níveis por módulo`,
    `Carga: ${data.load || "—"} kg por nível`,
    `Área livre: ${data.length || "—"} m comp. × ${data.width || "—"} m larg.`,
  ], [data]);

  function update<K extends keyof QuoteData>(field: K, value: QuoteData[K]) {
    setData((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function validate(currentStep: number) {
    if (currentStep === 0 && (!data.structure || !data.height)) return "Selecione a estrutura e informe a altura.";
    if (currentStep === 1 && (!data.levels || !data.load)) return "Informe os níveis e a carga por nível.";
    if (currentStep === 2 && (!data.length || !data.width)) return "Informe o comprimento e a largura disponíveis.";
    if (currentStep === 3) {
      if (!data.freight || !data.installation || !data.material || !data.urgency) return "Preencha as opções de logística e operação.";
      if (data.freight === "Com frete" && digits(data.cep).length !== 8) return "Informe um CEP válido para calcular o frete.";
    }
    if (currentStep === 4) {
      if (!data.name.trim() || !data.company.trim() || digits(data.phone).length < 10) return "Preencha nome, empresa e um telefone válido.";
      if (!data.consent) return "Autorize o uso dos dados para receber o orçamento.";
    }
    return "";
  }

  function next() {
    const validationError = validate(step);
    if (validationError) return setError(validationError);
    setStep((current) => Math.min(current + 1, 4));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validationError = validate(4);
    if (validationError) return setError(validationError);
    setSubmitting(true);
    setError("");
    try {
      const params = new URLSearchParams(window.location.search);
      const tracking = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].map((key) => [key, params.get(key) || ""]));
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ...tracking }),
      });
      const result = await response.json() as { whatsappUrl?: string; error?: string };
      if (!response.ok || !result.whatsappUrl) {
  throw new Error(result.error || "Não foi possível registrar a solicitação.");
}

window.fbq?.("track", "Purchase", {
  value: 0,
  currency: "BRL",
  content_name: "Solicitação de orçamento",
  content_category: data.structure,
});

// Pequena espera para o Pixel registrar antes de abrir o WhatsApp.
setTimeout(() => {
  window.location.href = result.whatsappUrl!;
}, 300);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Não foi possível concluir. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <form id="solicitar-orcamento" className="quote-card" onSubmit={submit} noValidate>
      <div className="quote-topline"><span>Etapa {step + 1} de 5</span><small>Leva cerca de 2 minutos</small></div>
      <Progress value={progress} aria-label={`Etapa ${step + 1} de 5`} />
      <div className="quote-heading"><h2>{title}</h2><p>{subtitle}</p></div>

      <div className="quote-body">
        {step === 0 && <>
          <RadioGroup className="choice-grid" value={data.structure} onValueChange={(value) => update("structure", value)}>
            {structureOptions.map(({ value, label, icon: Icon }) => (
              <label className="choice-card" key={value} data-selected={data.structure === value}>
                <RadioGroupItem value={value} aria-label={label} /><Icon aria-hidden="true" /><span>{label}</span>
                {data.structure === value && <Check className="selected-check" />}
              </label>
            ))}
          </RadioGroup>
          <Field label="Altura desejada" suffix="m"><Input inputMode="decimal" min="1" max="20" type="number" value={data.height} onChange={(e) => update("height", e.target.value)} placeholder="Ex.: 6" /></Field>
        </>}

        {step === 1 && <div className="fields-grid">
          <Field label="Níveis por módulo" suffix="níveis"><Input inputMode="numeric" min="1" max="12" type="number" value={data.levels} onChange={(e) => update("levels", e.target.value)} placeholder="Ex.: 3" /></Field>
          <Field label="Carga por nível" suffix="kg"><Input inputMode="numeric" min="1" type="number" value={data.load} onChange={(e) => update("load", e.target.value)} placeholder="Ex.: 2000" /></Field>
          <div className="form-hint"><CheckCircle2 /><p>A capacidade final será validada pela nossa equipe técnica.</p></div>
        </div>}

        {step === 2 && <div className="fields-grid">
          <Field label="Comprimento livre" suffix="m"><Input inputMode="decimal" min="1" type="number" value={data.length} onChange={(e) => update("length", e.target.value)} placeholder="Ex.: 22" /></Field>
          <Field label="Largura livre" suffix="m"><Input inputMode="decimal" min="1" type="number" value={data.width} onChange={(e) => update("width", e.target.value)} placeholder="Ex.: 27" /></Field>
          <div className="mini-summary">{summary.map((line) => <span key={line}>{line}</span>)}</div>
        </div>}

        {step === 3 && <div className="fields-grid compact">
          <ChoiceRow label="Precisa de frete?" value={data.freight} options={["Com frete", "Sem frete"]} onChange={(value) => update("freight", value)} />
          {data.freight === "Com frete" && <Field label="CEP de entrega"><Input inputMode="numeric" value={data.cep} onChange={(e) => update("cep", formatCep(e.target.value))} placeholder="00000-000" /></Field>}
          <ChoiceRow label="Montagem inclusa?" value={data.installation} options={["Com montagem", "Sem montagem"]} onChange={(value) => update("installation", value)} />
          <Field label="Material a armazenar"><Input value={data.material} onChange={(e) => update("material", e.target.value)} placeholder="Ex.: tecidos, caixas, alimentos" /></Field>
          <ChoiceRow label="Prazo" value={data.urgency} options={["Urgente", "Até 30 dias", "Planejamento"]} onChange={(value) => update("urgency", value)} />
          <Field label="Observações (opcional)"><Textarea value={data.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Conte algum detalhe importante da operação." /></Field>
        </div>}

        {step === 4 && <div className="fields-grid compact">
          <Field label="Seu nome"><Input autoComplete="name" value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Nome e sobrenome" /></Field>
          <Field label="Empresa"><Input autoComplete="organization" value={data.company} onChange={(e) => update("company", e.target.value)} placeholder="Nome da empresa" /></Field>
          <Field label="Telefone / WhatsApp"><Input autoComplete="tel" inputMode="tel" value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(00) 00000-0000" /></Field>
          <Field label="E-mail (opcional)"><Input autoComplete="email" type="email" value={data.email} onChange={(e) => update("email", e.target.value)} placeholder="voce@empresa.com.br" /></Field>
          <label className="consent-row"><Checkbox checked={data.consent} onCheckedChange={(checked) => update("consent", checked === true)} /><span>Autorizo o contato da Oliveira Estruturas sobre esta solicitação.</span></label>
        </div>}
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        {step > 0 && <Button type="button" variant="outline" className="back-button" onClick={() => { setStep((current) => current - 1); setError(""); }}><ArrowLeft /> Voltar</Button>}
        {step < 4
          ? <Button type="button" className="continue-button" onClick={next}>Continuar <ArrowRight /></Button>
          : <Button type="submit" className="continue-button" disabled={submitting}>{submitting ? <><LoaderCircle className="animate-spin" /> Salvando...</> : <><MessageCircle /> Enviar pelo WhatsApp</>}</Button>}
      </div>
      <p className="privacy-note"><CheckCircle2 /> Seus dados serão usados somente para atender esta solicitação.</p>
    </form>
  );
}

function Field({ label, suffix, children }: { label: string; suffix?: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span><div className="input-wrap">{children}{suffix && <small>{suffix}</small>}</div></label>;
}

function ChoiceRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <fieldset className="choice-row"><legend>{label}</legend><RadioGroup value={value} onValueChange={onChange} className="choice-pills">
    {options.map((option) => <label key={option} data-selected={value === option}><RadioGroupItem value={option} aria-label={option} /><span>{option}</span></label>)}
  </RadioGroup></fieldset>;
}
