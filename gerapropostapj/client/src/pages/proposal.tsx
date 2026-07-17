import React, { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { 
  Check, 
  Clock, 
  Stethoscope, 
  FileText, 
  HeartPulse, 
  Building2, 
  Users, 
  TrendingDown, 
  ShieldCheck, 
  Truck,
  ArrowRight,
  Phone,
  MessageCircle,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Assets
import logo from "@assets/logo-fundo-transparente-para-fundo-branco_1771271483318.png";
import heroImg from "@assets/jovem-e-bem-sucedida-programadora-retrato-de-engenheira-com-co_1771271556623.jpg";
import stylizedImg from "@assets/1_1771278907203.jpg";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Proposal() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const [data, setData] = useState({
    companyName: "Logmam Transportes Ltda.", // Default
    employees: 450, // Default
    price: 19.90, // Default
  });

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const company = params.get("company");
    const employees = params.get("employees");
    const price = params.get("price");

    if (company && employees && price) {
      setData({
        companyName: company,
        employees: parseInt(employees),
        price: parseFloat(price),
      });
    }
  }, [searchString]);

  const totalMonthly = data.employees * data.price;
  const pricePerDay = (data.price / 30).toFixed(2);
  
  const whatsappMessage = `Olá, gostaria de aprovar a proposta para a ${data.companyName}.`;
  const whatsappLink = `https://wa.me/5511970267810?text=${encodeURIComponent(whatsappMessage)}`;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <img src={logo} alt="WOW+ Logo" className="h-12 w-auto object-contain cursor-pointer" onClick={() => setLocation("/")} />
          
          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              className="hidden md:flex text-slate-500 hover:text-slate-900"
              onClick={() => setLocation("/")}
            >
              <Edit className="w-4 h-4 mr-2" />
              Nova Proposta
            </Button>
            <Button 
              className="hidden md:flex bg-primary hover:bg-primary/90 text-white rounded-full"
              onClick={() => window.open(whatsappLink, '_blank')}
            >
              Falar com Consultor
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40 z-10" />
          <img 
            src={heroImg} 
            alt="Professional Background" 
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="container mx-auto px-4 relative z-20">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              Proposta Comercial Exclusiva
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-slate-900 leading-tight mb-6">
              Saúde por Assinatura para <span className="text-primary">{data.companyName}</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl leading-relaxed">
              Uma solução moderna de saúde digital para democratizar o acesso, reduzir custos e cuidar de quem move sua empresa.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 text-lg h-14 shadow-lg shadow-orange-500/20"
                onClick={() => window.open(whatsappLink, '_blank')}
              >
                Aceitar Proposta
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8 text-lg h-14 border-slate-200 text-slate-700 hover:bg-slate-50">
                Ver Detalhes
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl font-heading font-bold text-slate-900 mb-6">
                Sobre a WOW+
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                A WOW+ é uma Health Tech brasileira especializada em soluções de saúde por assinatura, com sede em Osasco/SP. Atuamos por meio de plataforma digital própria, oferecendo acesso rápido, acessível e sem burocracia a serviços médicos e assistenciais.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                Nosso modelo foi desenvolvido para democratizar o acesso à saúde no Brasil, proporcionando atendimento 24 horas por dia, redução de custos empresariais e melhoria da qualidade de vida dos colaboradores.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <img 
                src={stylizedImg} 
                alt="WOW+ Stylized" 
                className="rounded-2xl shadow-2xl w-full max-w-md mx-auto"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border border-slate-100 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Atendimento</p>
                    <p className="font-bold text-slate-900">24h / 7 dias</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Context & Challenges */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-4">Contexto e Justificativa</h2>
            <p className="text-slate-600 text-lg">
              O setor logístico exige agilidade. Identificamos os principais desafios da {data.companyName} para propor uma solução sob medida.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: "Absenteísmo", desc: "Decorrente de demora em atendimento médico" },
              { icon: TrendingDown, title: "Custos Elevados", desc: "Impacto financeiro com benefícios tradicionais" },
              { icon: FileText, title: "Previsibilidade", desc: "Baixa previsibilidade orçamentária em saúde" },
              { icon: Stethoscope, title: "Acesso Difícil", desc: "Dificuldade de agendamento rápido com especialistas" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="mb-4 bg-orange-50 w-12 h-12 rounded-lg flex items-center justify-center text-primary">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 mb-4 px-4 py-1 text-sm">Solução Proposta</Badge>
            <h2 className="text-4xl font-heading font-bold text-slate-900">WOW+ Saúde</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* 24h Assistance */}
            <Card className="border-slate-100 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader>
                <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                  <Clock className="w-7 h-7" />
                </div>
                <CardTitle className="text-xl">Atendimento Médico 24h</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600"><strong>Clínico Geral</strong> – quantas vezes for necessário, durante o mês</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600"><strong>Pediatria</strong> – quantas vezes for necessário, durante o mês</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600"><strong>Descontos em Medicamentos</strong>: uso ilimitado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600"><strong>Descontos em Consultas e Exames Presenciais</strong>: uso ilimitado</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card className="border-slate-100 shadow-lg relative overflow-hidden lg:col-span-2">
              <CardHeader>
                <div className="bg-purple-50 w-14 h-14 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Especialidades Médicas</CardTitle>
                    <CardDescription>Consultas com Especialistas: até 3 (três) utilizações por mês por beneficiário</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="grid grid-cols-2 md:grid-cols-4 gap-3"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {[
                    "Cardiologia", "Ortopedia", "Dermatologia", "Psicologia",
                    "Nutrição", "Endocrinologia", "Gastroenterologia", "Ginecologia",
                    "Geriatria", "Urologia", "Otorrinolaringologia", "Psiquiatria"
                  ].map((spec) => (
                    <motion.div 
                      key={spec}
                      variants={fadeIn}
                      className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 font-medium text-center border border-slate-100"
                    >
                      {spec}
                    </motion.div>
                  ))}
                </motion.div>
                <p className="text-sm text-slate-400 mt-6 text-center italic">
                  + outras especialidades disponíveis na plataforma
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Benefits */}
          <div className="mt-8 bg-slate-900 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10 grid md:grid-cols-3 gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-heading font-bold mb-2">Benefícios Complementares</h3>
                <p className="text-slate-300">Vantagens exclusivas para seus colaboradores</p>
              </div>
              <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">%</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Medicamentos</h4>
                    <p className="text-slate-400 text-sm">Descontos de até 70% em farmácias</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Exames</h4>
                    <p className="text-slate-400 text-sm">Descontos de até 50% em presenciais</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Ativação Imediata</h4>
                    <p className="text-slate-400 text-sm">Sem carência após cadastro</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Suporte Dedicado</h4>
                    <p className="text-slate-400 text-sm">0800 e WhatsApp integrado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - The Highlight */}
      <section className="py-20 bg-orange-50/50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="border-none shadow-2xl overflow-hidden">
              <div className="grid md:grid-cols-5">
                <div className="md:col-span-3 p-8 md:p-12 bg-white">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Condições Comerciais Exclusivas</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-slate-600">Empresa</span>
                      <span className="font-semibold text-slate-900">{data.companyName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-slate-600">Colaboradores</span>
                      <span className="font-semibold text-slate-900">{data.employees} vidas</span>
                    </div>
                    <div className="flex justify-between items-center pb-3">
                      <span className="text-slate-600">Investimento Mensal</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(totalMonthly)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    * Valor correspondente a aproximadamente R$ {pricePerDay} por dia por colaborador.
                  </p>
                </div>
                <div className="md:col-span-2 bg-slate-900 p-8 md:p-12 flex flex-col justify-center items-center text-center text-white relative">
                  <div className="absolute inset-0 bg-primary/10" />
                  <p className="text-slate-300 uppercase tracking-widest text-xs font-bold mb-2 relative z-10">Valor por Colaborador</p>
                  <div className="relative z-10">
                    <span className="text-2xl font-medium align-top">R$</span>
                    <span className="text-6xl font-heading font-bold tracking-tight">
                      {Math.floor(data.price)}
                    </span>
                    <span className="text-2xl font-medium">
                      ,{(data.price % 1).toFixed(2).split('.')[1]}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2 relative z-10">/ mês</p>
                  <Button 
                    className="mt-8 w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-lg relative z-10"
                    onClick={() => window.open(whatsappLink, '_blank')}
                  >
                    Aprovar Proposta
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Strategic Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-slate-900">Benefícios Operacionais</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Redução de absenteísmo com atendimento remoto rápido",
                  "Acesso facilitado para colaboradores em campo/turnos",
                  "Melhoria na percepção de valorização do colaborador",
                  "Baixo impacto financeiro vs. planos tradicionais",
                  "Previsibilidade orçamentária e simplicidade"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-slate-600">
                    <Check className="w-5 h-5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-lg text-green-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-slate-900">Conformidade NR-1 (PGR)</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Apoio à gestão de riscos psicossociais (ansiedade, burnout)",
                  "Promoção da saúde preventiva e redução de agravamentos",
                  "Incentivo à cultura de autocuidado e responsabilidade",
                  "Mitigação de afastamentos prolongados",
                  "Melhoria de indicadores de saúde ocupacional"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-slate-600">
                    <Check className="w-5 h-5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline/Steps */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center text-slate-900 mb-12">Próximos Passos</h2>
          <div className="relative">
            {/* Line connecting steps */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 hidden md:block" />
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {[
                { step: "01", title: "Aprovação", desc: "Da proposta comercial" },
                { step: "02", title: "Contrato", desc: "Formalização jurídica" },
                { step: "03", title: "Base", desc: "Envio de colaboradores" },
                { step: "04", title: "Ativação", desc: "Liberação da plataforma" },
                { step: "05", title: "Comunicado", desc: "Lançamento oficial" },
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-center relative group hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-colors">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Footer */}
      <footer className="bg-slate-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <img src={logo} alt="WOW+" className="h-12 w-auto mx-auto mb-8" />
          <h2 className="text-3xl font-heading font-bold mb-6">Pronto para transformar a saúde na {data.companyName}?</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-lg">
            Estamos à disposição para realizar uma apresentação executiva detalhada para sua diretoria.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-14 text-lg">
              Aprovar Proposta Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          <div className="mt-20 pt-8 border-t border-slate-800 text-slate-500 text-sm">
            <p>&copy; 2026 WOW+ Saúde. Todos os direitos reservados. Proposta confidencial para {data.companyName}.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}