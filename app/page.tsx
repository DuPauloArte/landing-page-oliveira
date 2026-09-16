import Image from "next/image";
import { BadgeCheck, Boxes, Clock3, MapPin, MessageCircle, PackageCheck, Ruler, ShieldCheck, Truck } from "lucide-react";
import { QuoteForm } from "./quote-form";

function Brand() {
  return (
    <img
  src="/logo-oliveira-branco.png"
  alt="Oliveira Estruturas"
  className="h-10 w-auto"
/>
  );
}

export default function Home() {
  return (
    <main id="inicio">
      <header className="site-header">
        <div className="shell header-inner">
          <Brand />
          <div className="header-note"><MapPin aria-hidden="true" /><span>Atendimento em todo o Brasil</span></div>
          <a className="header-cta" href="#solicitar-orcamento">Solicitar orçamento</a>
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <Image className="hero-image" src="/hero-warehouse.png" alt="Galpão organizado com estruturas porta-paletes" fill priority sizes="100vw" />
        <div className="hero-wash" />
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Estruturas que impulsionam seu negócio</p>
            <h1 id="hero-title">Seu projeto de armazenagem <span>começa aqui.</span></h1>
            <p className="hero-lead">Conte o que sua operação precisa e receba uma avaliação personalizada diretamente pelo WhatsApp.</p>
            <a className="mobile-start" href="#solicitar-orcamento">Começar meu orçamento</a>
            <div className="hero-points" aria-label="Diferenciais">
              <span><ShieldCheck /> Projeto seguro</span>
              <span><Ruler /> Solução sob medida</span>
              <span><Clock3 /> Retorno rápido</span>
            </div>
          </div>
          <QuoteForm />
        </div>
      </section>

      <section className="trust-strip" aria-label="Experiência da Oliveira Estruturas">
        <div className="shell trust-grid">
          <div><strong>10+</strong><span>anos de experiência</span></div>
          <div><strong>500+</strong><span>projetos entregues</span></div>
          <div><strong>100%</strong><span>atendimento nacional</span></div>
        </div>
      </section>

      <section className="how shell" aria-labelledby="como-funciona">
        <div className="section-heading">
          <p className="eyebrow">Simples, rápido e objetivo</p>
          <h2 id="como-funciona">Orçamento completo em poucos passos</h2>
          <p>Você informa os dados essenciais. Nossa equipe analisa e continua o atendimento pelo WhatsApp.</p>
        </div>
        <div className="steps-grid">
          <article><span>01</span><Boxes /><h3>Descreva a estrutura</h3><p>Informe medidas, níveis, capacidade de carga e área disponível.</p></article>
          <article><span>02</span><Truck /><h3>Defina a logística</h3><p>Escolha frete e montagem e informe o CEP da operação.</p></article>
          <article><span>03</span><MessageCircle /><h3>Receba o atendimento</h3><p>O vendedor recebe tudo organizado e continua a conversa com você.</p></article>
        </div>
      </section>

      <section className="proof">
        <div className="shell proof-grid">
          <div>
            <p className="eyebrow">Experiência aplicada ao seu espaço</p>
            <h2>Da necessidade à estrutura pronta.</h2>
            <p>Compra e venda, montagem, desmontagem e readequação de sistemas de armazenagem para galpões, indústrias e centros de distribuição.</p>
          </div>
          <ul>
            <li><BadgeCheck /> Equipe técnica especializada</li>
            <li><PackageCheck /> Estruturas novas e seminovas</li>
            <li><ShieldCheck /> Foco em segurança e qualidade</li>
          </ul>
        </div>
      </section>

      <footer><div className="shell footer-inner"><Brand /><p>© 2026 Oliveira Estruturas. Atendimento em todo o Brasil.</p></div></footer>
    </main>
  );
}
