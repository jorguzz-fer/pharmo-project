import { useState, useEffect } from 'react';
import { Search, FlaskConical, Shield, Ban, Plus, Trash2, X, Loader2, Calculator, Pencil, Save } from 'lucide-react';
import {
    insumoService,
    regraExcecaoService,
    formaFarmaceuticaService,
    LISTAS_CONTROLE,
    UNIDADES_MANIPULACAO,
    TIPOS_CALCULO,
} from '../../services/insumo.service';
import type { InsumoFarmaceutico, FormaFarmaceutica, RegraExcecao, InsumoFormData } from '../../services/insumo.service';
import { precificacaoService } from '../../services/precificacao.service';
import type { CondicoesComerciaisInput, OrigemCondicao, PrecificacaoResultado } from '../../services/precificacao.service';
import { clinicService } from '../../services/clinicService';
import type { Clinica } from '../../services/clinicService';

type Tab = 'insumos' | 'controlados' | 'excecoes' | 'precificacao';

/** Ingrediente montado no simulador: o insumo escolhido + dosagem e quantidade digitadas. */
type SimIngrediente = {
    insumo: InsumoFarmaceutico;
    dosagem_mg: string;
    quantidade: string;
};

/** Formulário de insumo: tudo texto enquanto o admin digita, convertido na hora de salvar. */
const INSUMO_FORM_VAZIO = {
    codigo_interno: '',
    descricao: '',
    valor_custo: '',
    custo_referencia: '',
    markup: '',
    un_manipulacao: 'mg',
    estoque: '',
    calculo_tipo: 'Cápsula',
    controlado: false,
    lista_controle: '',
};

type InsumoForm = typeof INSUMO_FORM_VAZIO;

function insumoParaForm(insumo: InsumoFarmaceutico): InsumoForm {
    return {
        codigo_interno: String(insumo.codigo_interno),
        descricao: insumo.descricao,
        valor_custo: String(insumo.valor_custo),
        custo_referencia: String(insumo.custo_referencia),
        markup: String(insumo.markup),
        un_manipulacao: insumo.un_manipulacao || 'mg',
        estoque: String(insumo.estoque),
        calculo_tipo: insumo.calculo_tipo || 'Cápsula',
        controlado: insumo.controlado,
        lista_controle: insumo.lista_controle || '',
    };
}

const CONDICOES_VAZIAS = {
    taxa_manipulacao: '',
    custo_embalagens: '',
    desconto_parceiro: '',
    adicional_entrega: '',
    adicional_biscoito: '',
};

type CondicoesForm = typeof CONDICOES_VAZIAS;

/** Campos editáveis do cálculo, na mesma ordem em que entram na fórmula. */
const CAMPOS_SIMULADOR: {
    name: keyof CondicoesForm;
    label: string;
    hint: string;
    step: string;
    max?: string;
}[] = [
    {
        name: 'taxa_manipulacao',
        label: 'Taxa de Manipulação (R$)',
        hint: 'Valor fixo cobrado por manipulação',
        step: '0.01',
    },
    {
        name: 'custo_embalagens',
        label: 'Taxa de Embalagem (R$)',
        hint: 'Custo fixo de embalagem por pedido',
        step: '0.01',
    },
    {
        name: 'desconto_parceiro',
        label: 'Desconto (%)',
        hint: 'Aplicado sobre o subtotal (ex: 40 = 40%)',
        step: '0.1',
        max: '100',
    },
    {
        name: 'adicional_entrega',
        label: 'Frete / Entrega (R$)',
        hint: 'Somado depois do desconto',
        step: '0.01',
    },
    {
        name: 'adicional_biscoito',
        label: 'Adicional Biscoito (R$)',
        hint: 'Só entra quando a forma é biscoito/petisco',
        step: '0.01',
    },
];

/** Converte o texto do input em número, aceitando vírgula como separador decimal. */
function paraNumero(valor: string): number | undefined {
    if (!valor.trim()) return undefined;
    const n = parseFloat(valor.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
}

function moeda(valor: number): string {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

export function AdminInsumos() {
    const [activeTab, setActiveTab] = useState<Tab>('insumos');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    // Insumos tab
    const [insumos, setInsumos] = useState<InsumoFarmaceutico[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Controlados tab
    const [controlados, setControlados] = useState<InsumoFarmaceutico[]>([]);

    // Exceções tab
    const [excecoes, setExcecoes] = useState<RegraExcecao[]>([]);
    const [formas, setFormas] = useState<FormaFarmaceutica[]>([]);
    const [showAddExcecao, setShowAddExcecao] = useState(false);
    const [addExcecaoInsumo, setAddExcecaoInsumo] = useState('');
    const [addExcecaoForma, setAddExcecaoForma] = useState('');
    const [searchInsumo, setSearchInsumo] = useState('');
    const [insumoResults, setInsumoResults] = useState<InsumoFarmaceutico[]>([]);
    const [selectedInsumo, setSelectedInsumo] = useState<InsumoFarmaceutico | null>(null);

    // Cadastro de insumo (criar/editar)
    const [showInsumoForm, setShowInsumoForm] = useState(false);
    const [insumoEditando, setInsumoEditando] = useState<InsumoFarmaceutico | null>(null);
    const [insumoForm, setInsumoForm] = useState<InsumoForm>(INSUMO_FORM_VAZIO);
    const [insumoFormErro, setInsumoFormErro] = useState<string | null>(null);
    const [salvandoInsumo, setSalvandoInsumo] = useState(false);

    // Cadastro de controlado (incluir/editar)
    const [showControladoForm, setShowControladoForm] = useState(false);
    const [controladoAlvo, setControladoAlvo] = useState<InsumoFarmaceutico | null>(null);
    const [controladoLista, setControladoLista] = useState('');
    const [controladoBusca, setControladoBusca] = useState('');
    const [controladoResultados, setControladoResultados] = useState<InsumoFarmaceutico[]>([]);
    const [salvandoControlado, setSalvandoControlado] = useState(false);

    // Simulador de preço
    const [simIngredientes, setSimIngredientes] = useState<SimIngrediente[]>([]);
    const [simBusca, setSimBusca] = useState('');
    const [simResultadosBusca, setSimResultadosBusca] = useState<InsumoFarmaceutico[]>([]);
    const [simForma, setSimForma] = useState('');
    const [simCondicoes, setSimCondicoes] = useState<CondicoesForm>(CONDICOES_VAZIAS);
    const [simClinicas, setSimClinicas] = useState<Clinica[]>([]);
    const [simClinicaId, setSimClinicaId] = useState('');
    const [simResultado, setSimResultado] = useState<PrecificacaoResultado | null>(null);
    const [simErro, setSimErro] = useState<string | null>(null);
    const [simCalculando, setSimCalculando] = useState(false);

    useEffect(() => {
        if (activeTab === 'insumos') loadInsumos();
        if (activeTab === 'controlados') loadControlados();
        if (activeTab === 'excecoes') { loadExcecoes(); loadFormas(); }
        if (activeTab === 'precificacao') { loadFormas(); loadClinicas(); }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'insumos') loadInsumos();
    }, [page]);

    const loadInsumos = async () => {
        setLoading(true);
        try {
            const data = await insumoService.buscar(search, page, 20);
            setInsumos(data.data);
            setTotalPages(data.totalPages);
            setTotal(data.total);
        } catch (error) {
            console.error('Erro ao carregar insumos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadControlados = async () => {
        setLoading(true);
        try {
            const data = await insumoService.listarControlados();
            setControlados(data.data);
        } catch (error) {
            console.error('Erro ao carregar controlados:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadExcecoes = async () => {
        setLoading(true);
        try {
            const data = await regraExcecaoService.listar();
            setExcecoes(data.data);
        } catch (error) {
            console.error('Erro ao carregar exceções:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFormas = async () => {
        try {
            const data = await formaFarmaceuticaService.listar();
            setFormas(data);
        } catch (error) {
            console.error('Erro ao carregar formas:', error);
        }
    };

    const loadClinicas = async () => {
        try {
            const data = await clinicService.getAll();
            setSimClinicas(data);
        } catch (error) {
            console.error('Erro ao carregar clínicas:', error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadInsumos();
    };

    // --- Simulador de preço ---

    const handleSimBuscarInsumo = async () => {
        if (simBusca.trim().length < 2) return;
        try {
            const data = await insumoService.buscar(simBusca, 1, 10);
            setSimResultadosBusca(data.data);
        } catch (error) {
            console.error('Erro ao buscar insumo:', error);
        }
    };

    const handleSimAddIngrediente = (insumo: InsumoFarmaceutico) => {
        if (simIngredientes.some((i) => i.insumo.codigo_interno === insumo.codigo_interno)) {
            alert('Este insumo já está na formulação');
            return;
        }
        setSimIngredientes((atual) => [...atual, { insumo, dosagem_mg: '', quantidade: '30' }]);
        setSimResultadosBusca([]);
        setSimBusca('');
    };

    const handleSimIngredienteChange = (codigo: number, campo: 'dosagem_mg' | 'quantidade', valor: string) => {
        setSimIngredientes((atual) =>
            atual.map((i) => (i.insumo.codigo_interno === codigo ? { ...i, [campo]: valor } : i))
        );
    };

    const handleSimRemoveIngrediente = (codigo: number) => {
        setSimIngredientes((atual) => atual.filter((i) => i.insumo.codigo_interno !== codigo));
    };

    const handleSimCondicaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSimCondicoes((atual) => ({ ...atual, [name]: value }));
    };

    /** Traz as condições cadastradas da clínica para os campos, como ponto de partida. */
    const handleSimCarregarClinica = (clinicaId: string) => {
        setSimClinicaId(clinicaId);
        if (!clinicaId) {
            setSimCondicoes(CONDICOES_VAZIAS);
            return;
        }
        const clinica = simClinicas.find((c) => c.id === clinicaId);
        if (!clinica) return;
        setSimCondicoes({
            taxa_manipulacao: clinica.taxa_manipulacao != null ? String(clinica.taxa_manipulacao) : '',
            custo_embalagens: clinica.custo_embalagens != null ? String(clinica.custo_embalagens) : '',
            desconto_parceiro: clinica.desconto_parceiro != null ? String(Number(clinica.desconto_parceiro) * 100) : '',
            adicional_entrega: clinica.adicional_entrega != null ? String(clinica.adicional_entrega) : '',
            adicional_biscoito: clinica.adicional_biscoito != null ? String(clinica.adicional_biscoito) : '',
        });
    };

    const handleSimLimpar = () => {
        setSimIngredientes([]);
        setSimCondicoes(CONDICOES_VAZIAS);
        setSimClinicaId('');
        setSimForma('');
        setSimResultado(null);
        setSimErro(null);
    };

    const handleSimCalcular = async () => {
        setSimErro(null);

        if (simIngredientes.length === 0) {
            setSimErro('Adicione pelo menos um insumo à formulação');
            return;
        }
        if (!simForma) {
            setSimErro('Selecione a forma farmacêutica');
            return;
        }

        const ingredientes = [];
        for (const item of simIngredientes) {
            const dosagem_mg = paraNumero(item.dosagem_mg);
            const quantidade = paraNumero(item.quantidade);
            if (!dosagem_mg || dosagem_mg <= 0) {
                setSimErro(`Informe a dosagem (mg) de ${item.insumo.descricao}`);
                return;
            }
            if (!quantidade || quantidade <= 0 || !Number.isInteger(quantidade)) {
                setSimErro(`Informe a quantidade (número inteiro de doses) de ${item.insumo.descricao}`);
                return;
            }
            ingredientes.push({ codigo_interno: item.insumo.codigo_interno, dosagem_mg, quantidade });
        }

        // Só vai para a API o que foi digitado: o resto continua vindo do cadastro da clínica.
        const condicoes: CondicoesComerciaisInput = {};
        const taxa_manipulacao = paraNumero(simCondicoes.taxa_manipulacao);
        if (taxa_manipulacao !== undefined) condicoes.taxa_manipulacao = taxa_manipulacao;
        const custo_embalagens = paraNumero(simCondicoes.custo_embalagens);
        if (custo_embalagens !== undefined) condicoes.custo_embalagens = custo_embalagens;
        const desconto = paraNumero(simCondicoes.desconto_parceiro);
        if (desconto !== undefined) condicoes.desconto_parceiro = desconto / 100;
        const adicional_entrega = paraNumero(simCondicoes.adicional_entrega);
        if (adicional_entrega !== undefined) condicoes.adicional_entrega = adicional_entrega;
        const adicional_biscoito = paraNumero(simCondicoes.adicional_biscoito);
        if (adicional_biscoito !== undefined) condicoes.adicional_biscoito = adicional_biscoito;

        if (condicoes.desconto_parceiro !== undefined && (condicoes.desconto_parceiro < 0 || condicoes.desconto_parceiro > 1)) {
            setSimErro('O desconto deve estar entre 0 e 100%');
            return;
        }

        try {
            setSimCalculando(true);
            const resultado = await precificacaoService.calcular({
                ingredientes,
                forma_farmaceutica: simForma,
                clinica_id: simClinicaId || undefined,
                condicoes: Object.keys(condicoes).length > 0 ? condicoes : undefined,
            });
            setSimResultado(resultado);
        } catch (error) {
            // 422 devolve o resultado com os erros do motor (insumo sem estoque, forma proibida…)
            const resposta = error as { response?: { data?: PrecificacaoResultado & { error?: string } } };
            const corpo = resposta?.response?.data;
            if (corpo?.erros?.length) {
                setSimResultado(corpo);
                setSimErro(corpo.erros.join('; '));
            } else {
                const mensagem = error instanceof Error ? error.message : 'Erro ao calcular o preço';
                setSimResultado(null);
                setSimErro(corpo?.error || mensagem);
            }
        } finally {
            setSimCalculando(false);
        }
    };

    const origemBadge = (origem?: OrigemCondicao) => {
        const estilos: Record<OrigemCondicao, string> = {
            manual: 'bg-amber-100 text-amber-700',
            clinica: 'bg-teal-100 text-teal-700',
            padrao: 'bg-gray-100 text-gray-500',
        };
        const rotulos: Record<OrigemCondicao, string> = {
            manual: 'informado',
            clinica: 'clínica',
            padrao: 'padrão',
        };
        if (!origem) return null;
        return (
            <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded font-medium ${estilos[origem]}`}>
                {rotulos[origem]}
            </span>
        );
    };

    /** Extrai a mensagem da API, preferindo os detalhes de validação quando existirem. */
    const mensagemErro = (error: unknown, padrao: string) => {
        const corpo = (error as { response?: { data?: { error?: string; detalhes?: string[] } } })?.response?.data;
        if (corpo?.detalhes?.length) return corpo.detalhes.join('; ');
        if (corpo?.error) return corpo.error;
        return error instanceof Error ? error.message : padrao;
    };

    // --- Cadastro de insumo ---

    const abrirNovoInsumo = () => {
        setInsumoEditando(null);
        setInsumoForm(INSUMO_FORM_VAZIO);
        setInsumoFormErro(null);
        setShowInsumoForm(true);
    };

    const abrirEdicaoInsumo = (insumo: InsumoFarmaceutico) => {
        setInsumoEditando(insumo);
        setInsumoForm(insumoParaForm(insumo));
        setInsumoFormErro(null);
        setShowInsumoForm(true);
    };

    const fecharInsumoForm = () => {
        setShowInsumoForm(false);
        setInsumoEditando(null);
        setInsumoFormErro(null);
    };

    const handleInsumoFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setInsumoForm((atual) => ({
            ...atual,
            [name]: type === 'checkbox' ? checked : value,
            // Desmarcar controlado limpa a lista, como o servidor faz ao salvar
            ...(name === 'controlado' && !checked ? { lista_controle: '' } : {}),
        }));
    };

    const handleSalvarInsumo = async () => {
        setInsumoFormErro(null);

        const codigo = paraNumero(insumoForm.codigo_interno);
        const valor_custo = paraNumero(insumoForm.valor_custo);
        const custo_referencia = paraNumero(insumoForm.custo_referencia);
        const markup = paraNumero(insumoForm.markup);
        const estoque = paraNumero(insumoForm.estoque);

        if (!codigo || !Number.isInteger(codigo) || codigo <= 0) {
            setInsumoFormErro('Informe o código interno (número inteiro positivo)');
            return;
        }
        if (insumoForm.descricao.trim().length < 2) {
            setInsumoFormErro('Informe a descrição do insumo');
            return;
        }
        if (valor_custo === undefined || custo_referencia === undefined || markup === undefined || estoque === undefined) {
            setInsumoFormErro('Preencha custo, custo de referência, markup e estoque');
            return;
        }
        if (valor_custo < 0 || custo_referencia < 0 || markup < 0 || estoque < 0) {
            setInsumoFormErro('Custo, markup e estoque não podem ser negativos');
            return;
        }
        if (insumoForm.controlado && !insumoForm.lista_controle) {
            setInsumoFormErro('Selecione a lista de controle');
            return;
        }

        const payload: InsumoFormData = {
            codigo_interno: codigo,
            descricao: insumoForm.descricao.trim(),
            valor_custo,
            custo_referencia,
            markup,
            un_manipulacao: insumoForm.un_manipulacao,
            estoque,
            calculo_tipo: insumoForm.calculo_tipo,
            controlado: insumoForm.controlado,
            lista_controle: insumoForm.controlado ? insumoForm.lista_controle : null,
        };

        try {
            setSalvandoInsumo(true);
            if (insumoEditando) {
                await insumoService.atualizar(insumoEditando.id, payload);
            } else {
                await insumoService.criar(payload);
            }
            fecharInsumoForm();
            if (activeTab === 'controlados') loadControlados();
            else loadInsumos();
        } catch (error) {
            setInsumoFormErro(mensagemErro(error, 'Erro ao salvar o insumo'));
        } finally {
            setSalvandoInsumo(false);
        }
    };

    const handleExcluirInsumo = async (insumo: InsumoFarmaceutico) => {
        if (!confirm(`Remover "${insumo.descricao}" da base ativa?\n\nO histórico é preservado e o insumo deixa de aparecer nas buscas e no cálculo de preço.`)) return;
        try {
            await insumoService.inativar(insumo.id);
            if (activeTab === 'controlados') loadControlados();
            else loadInsumos();
        } catch (error) {
            alert(mensagemErro(error, 'Erro ao remover o insumo'));
        }
    };

    // --- Cadastro de controlado ---

    const abrirIncluirControlado = () => {
        setControladoAlvo(null);
        setControladoLista('');
        setControladoBusca('');
        setControladoResultados([]);
        setShowControladoForm(true);
    };

    const abrirEditarControlado = (insumo: InsumoFarmaceutico) => {
        setControladoAlvo(insumo);
        setControladoLista(insumo.lista_controle || '');
        setControladoBusca('');
        setControladoResultados([]);
        setShowControladoForm(true);
    };

    const handleBuscarInsumoControlado = async () => {
        if (controladoBusca.trim().length < 2) return;
        try {
            const data = await insumoService.buscar(controladoBusca, 1, 10);
            setControladoResultados(data.data);
        } catch (error) {
            console.error('Erro ao buscar insumo:', error);
        }
    };

    const handleSalvarControlado = async () => {
        if (!controladoAlvo || !controladoLista) {
            alert('Selecione o insumo e a lista de controle');
            return;
        }
        try {
            setSalvandoControlado(true);
            await insumoService.toggleControlado(controladoAlvo.id, true, controladoLista);
            setShowControladoForm(false);
            setControladoAlvo(null);
            if (activeTab === 'controlados') loadControlados();
            else loadInsumos();
        } catch (error) {
            alert(mensagemErro(error, 'Erro ao salvar o controle'));
        } finally {
            setSalvandoControlado(false);
        }
    };

    const handleRemoverControlado = async (insumo: InsumoFarmaceutico) => {
        if (!confirm(`Remover "${insumo.descricao}" da lista de controlados?\n\nO insumo continua na base — só deixa de exigir receituário especial.`)) return;
        try {
            await insumoService.toggleControlado(insumo.id, false);
            if (activeTab === 'controlados') loadControlados();
            else loadInsumos();
        } catch (error) {
            alert(mensagemErro(error, 'Erro ao remover o controle'));
        }
    };

    const handleSearchInsumoForExcecao = async () => {
        if (searchInsumo.trim().length < 2) return;
        try {
            const data = await insumoService.buscar(searchInsumo, 1, 10);
            setInsumoResults(data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddExcecao = async () => {
        if (!selectedInsumo || !addExcecaoForma) {
            alert('Selecione o insumo e a forma farmacêutica');
            return;
        }
        try {
            await regraExcecaoService.adicionar(selectedInsumo.id, addExcecaoForma);
            setShowAddExcecao(false);
            setSelectedInsumo(null);
            setSearchInsumo('');
            setAddExcecaoForma('');
            setInsumoResults([]);
            loadExcecoes();
        } catch (error: any) {
            alert(error?.response?.data?.error || 'Erro ao adicionar exceção');
        }
    };

    const handleRemoveExcecao = async (id: string) => {
        if (!confirm('Remover esta regra de exceção?')) return;
        try {
            await regraExcecaoService.remover(id);
            loadExcecoes();
        } catch (error: any) {
            alert(error?.response?.data?.error || 'Erro ao remover');
        }
    };

    const getListaBadge = (lista: string | null) => {
        if (!lista) return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">Sem lista</span>;
        const colors: Record<string, string> = {
            'C1': 'bg-red-100 text-red-700',
            'B1': 'bg-orange-100 text-orange-700',
            'A2': 'bg-purple-100 text-purple-700',
            'ANTIMICROBIANO': 'bg-blue-100 text-blue-700',
        };
        return <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${colors[lista] || 'bg-gray-100 text-gray-700'}`}>{lista}</span>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Insumos Farmacêuticos</h1>
                <p className="text-gray-600 mt-1">Gerenciar base de insumos, controlados e regras de exceção</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('insumos')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'insumos'
                            ? 'border-teal-600 text-teal-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <FlaskConical className="w-4 h-4 inline mr-2" />
                        Todos os Insumos ({total})
                    </button>
                    <button
                        onClick={() => setActiveTab('controlados')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'controlados'
                            ? 'border-teal-600 text-teal-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Shield className="w-4 h-4 inline mr-2" />
                        Controlados ({controlados.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('excecoes')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'excecoes'
                            ? 'border-teal-600 text-teal-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Ban className="w-4 h-4 inline mr-2" />
                        Regras de Exceção ({excecoes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('precificacao')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'precificacao'
                            ? 'border-teal-600 text-teal-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Calculator className="w-4 h-4 inline mr-2" />
                        Simulador de Preço
                    </button>
                </nav>
            </div>

            {/* Tab: Todos os Insumos */}
            {activeTab === 'insumos' && (
                <div className="space-y-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nome ou código..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                            Buscar
                        </button>
                        <button
                            type="button"
                            onClick={abrirNovoInsumo}
                            className="flex items-center gap-2 px-4 py-2 border border-teal-600 text-teal-700 rounded-lg hover:bg-teal-50 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Insumo
                        </button>
                    </form>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Un</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Custo Efetivo</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Markup</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estoque</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {insumos.map((insumo) => (
                                            <tr key={insumo.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-mono text-gray-600">{insumo.codigo_interno}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {insumo.descricao}
                                                    {insumo.formas_proibidas.length > 0 && (
                                                        <span className="ml-2 text-xs text-red-500" title={`Não faz em: ${insumo.formas_proibidas.join(', ')}`}>
                                                            <Ban className="w-3 h-3 inline" />
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{insumo.un_manipulacao}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900">R$ {insumo.custo_efetivo.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-600">{insumo.markup}x</td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    {insumo.disponivel ? (
                                                        <span className="text-green-600">{Number(insumo.estoque).toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-red-500">Sem estoque</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {insumo.controlado ? getListaBadge(insumo.lista_controle) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => abrirEdicaoInsumo(insumo)}
                                                            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-teal-700"
                                                            title="Editar insumo"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => insumo.controlado ? handleRemoverControlado(insumo) : abrirEditarControlado(insumo)}
                                                            className={`p-1.5 rounded ${insumo.controlado
                                                                ? 'text-red-600 hover:bg-red-50'
                                                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                                            }`}
                                                            title={insumo.controlado ? 'Remover da lista de controlados' : 'Marcar como controlado'}
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleExcluirInsumo(insumo)}
                                                            className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600"
                                                            title="Remover da base ativa"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-4 py-3 border-t flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    Página {page} de {totalPages} ({total} insumos)
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Controlados */}
            {activeTab === 'controlados' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={abrirIncluirControlado}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                            <Plus className="w-4 h-4" />
                            Incluir Controlado
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                        </div>
                    ) : controlados.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">Nenhum insumo controlado cadastrado</div>
                    ) : (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lista</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Un</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Custo Efetivo</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estoque</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Exceções</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {controlados.map((insumo) => (
                                            <tr key={insumo.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-mono text-gray-600">{insumo.codigo_interno}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{insumo.descricao}</td>
                                                <td className="px-4 py-3 text-center">{getListaBadge(insumo.lista_controle)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{insumo.un_manipulacao}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                                    R$ {(Math.max(insumo.valor_custo, insumo.custo_referencia)).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    {insumo.disponivel ? (
                                                        <span className="text-green-600">{Number(insumo.estoque).toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-red-500">0</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {insumo.formas_proibidas.length > 0 ? (
                                                        <span className="text-xs text-red-600">
                                                            {insumo.formas_proibidas.join(', ')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => abrirEditarControlado(insumo)}
                                                            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-teal-700"
                                                            title="Alterar a lista de controle"
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => abrirEdicaoInsumo(insumo)}
                                                            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-teal-700"
                                                            title="Editar insumo"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoverControlado(insumo)}
                                                            className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600"
                                                            title="Remover da lista de controlados"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Regras de Exceção */}
            {activeTab === 'excecoes' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowAddExcecao(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Regra
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                        </div>
                    ) : excecoes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">Nenhuma regra de exceção cadastrada</div>
                    ) : (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insumo</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forma Proibida</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {excecoes.map((exc) => (
                                        <tr key={exc.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-mono text-gray-600">{exc.insumo_codigo}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{exc.insumo_descricao}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                                                    {exc.forma_nome}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{exc.descricao || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleRemoveExcecao(exc.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                    title="Remover regra"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Modal: Adicionar Exceção */}
                    {showAddExcecao && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Nova Regra de Exceção</h3>
                                    <button onClick={() => { setShowAddExcecao(false); setSelectedInsumo(null); setInsumoResults([]); setSearchInsumo(''); }}>
                                        <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                    </button>
                                </div>

                                {/* Buscar Insumo */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Insumo</label>
                                    {selectedInsumo ? (
                                        <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg">
                                            <span className="text-sm font-medium">
                                                [{selectedInsumo.codigo_interno}] {selectedInsumo.descricao}
                                            </span>
                                            <button onClick={() => setSelectedInsumo(null)} className="text-gray-400 hover:text-gray-600">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={searchInsumo}
                                                    onChange={(e) => setSearchInsumo(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSearchInsumoForExcecao()}
                                                    placeholder="Buscar insumo por nome ou código..."
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                                />
                                                <button onClick={handleSearchInsumoForExcecao} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                                                    <Search className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {insumoResults.length > 0 && (
                                                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                                                    {insumoResults.map((ins) => (
                                                        <button
                                                            key={ins.id}
                                                            onClick={() => { setSelectedInsumo(ins); setInsumoResults([]); }}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                                        >
                                                            [{ins.codigo_interno}] {ins.descricao}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Forma Farmacêutica */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Forma Farmacêutica Proibida</label>
                                    <select
                                        value={addExcecaoForma}
                                        onChange={(e) => setAddExcecaoForma(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="">Selecione a forma...</option>
                                        {formas.map((f) => (
                                            <option key={f.id} value={f.id}>{f.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => { setShowAddExcecao(false); setSelectedInsumo(null); }}
                                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddExcecao}
                                        disabled={!selectedInsumo || !addExcecaoForma}
                                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
                                    >
                                        Adicionar Regra
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Simulador de Preço */}
            {activeTab === 'precificacao' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                        Monte uma formulação, ajuste os parâmetros do cálculo e confira o preço final.
                        Os valores digitados aqui valem só para esta simulação — o cadastro das clínicas não é alterado.
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Formulação */}
                        <div className="bg-white rounded-lg shadow p-6 space-y-4">
                            <h3 className="font-semibold text-gray-900">1. Formulação</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adicionar insumo</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={simBusca}
                                        onChange={(e) => setSimBusca(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSimBuscarInsumo()}
                                        placeholder="Buscar por nome ou código..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                    <button
                                        onClick={handleSimBuscarInsumo}
                                        className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                </div>
                                {simResultadosBusca.length > 0 && (
                                    <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg divide-y">
                                        {simResultadosBusca.map((ins) => (
                                            <button
                                                key={ins.id}
                                                onClick={() => handleSimAddIngrediente(ins)}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between gap-2"
                                            >
                                                <span>[{ins.codigo_interno}] {ins.descricao}</span>
                                                <span className="text-gray-500 whitespace-nowrap">
                                                    {moeda(ins.custo_efetivo)}/g · {ins.markup}x
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {simIngredientes.length === 0 ? (
                                <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-lg">
                                    Nenhum insumo adicionado
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {simIngredientes.map((item) => (
                                        <div key={item.insumo.codigo_interno} className="border rounded-lg p-3 space-y-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-sm font-medium text-gray-900">
                                                    [{item.insumo.codigo_interno}] {item.insumo.descricao}
                                                </span>
                                                <button
                                                    onClick={() => handleSimRemoveIngrediente(item.insumo.codigo_interno)}
                                                    className="text-gray-400 hover:text-red-600"
                                                    title="Remover insumo"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Dosagem (mg)</label>
                                                    <input
                                                        type="number"
                                                        value={item.dosagem_mg}
                                                        onChange={(e) => handleSimIngredienteChange(item.insumo.codigo_interno, 'dosagem_mg', e.target.value)}
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="0"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Quantidade (doses)</label>
                                                    <input
                                                        type="number"
                                                        value={item.quantidade}
                                                        onChange={(e) => handleSimIngredienteChange(item.insumo.codigo_interno, 'quantidade', e.target.value)}
                                                        step="1"
                                                        min="1"
                                                        placeholder="30"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Custo efetivo {moeda(item.insumo.custo_efetivo)}/g · markup {item.insumo.markup}x
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Forma Farmacêutica</label>
                                <select
                                    value={simForma}
                                    onChange={(e) => setSimForma(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="">Selecione a forma...</option>
                                    {formas.map((f) => (
                                        <option key={f.id} value={f.nome}>{f.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Parâmetros do cálculo */}
                        <div className="bg-white rounded-lg shadow p-6 space-y-4">
                            <h3 className="font-semibold text-gray-900">2. Parâmetros do cálculo</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Partir das condições de uma clínica (opcional)
                                </label>
                                <select
                                    value={simClinicaId}
                                    onChange={(e) => handleSimCarregarClinica(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="">Nenhuma — usar só os valores digitados</option>
                                    {simClinicas.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nome_fantasia}</option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Traz os valores cadastrados do parceiro para os campos abaixo. Depois é só editar.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                                {CAMPOS_SIMULADOR.map((campo) => (
                                    <div key={campo.name}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {campo.label}
                                        </label>
                                        <input
                                            type="number"
                                            name={campo.name}
                                            value={simCondicoes[campo.name]}
                                            onChange={handleSimCondicaoChange}
                                            step={campo.step}
                                            min="0"
                                            max={campo.max}
                                            placeholder="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">{campo.hint}</p>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-gray-500 pt-2 border-t">
                                Campo em branco usa o valor da clínica selecionada — ou zero, se nenhuma for escolhida.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleSimLimpar}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                        >
                            Limpar
                        </button>
                        <button
                            onClick={handleSimCalcular}
                            disabled={simCalculando}
                            className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
                        >
                            {simCalculando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                            {simCalculando ? 'Calculando...' : 'Calcular Preço'}
                        </button>
                    </div>

                    {simErro && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                            {simErro}
                        </div>
                    )}

                    {simResultado && (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b">
                                <h3 className="font-semibold text-gray-900">Composição do cálculo</h3>
                                <p className="text-sm text-gray-500">
                                    Forma: {simResultado.forma_farmaceutica}
                                </p>
                            </div>

                            {simResultado.ingredientes.length > 0 && (
                                <div className="overflow-x-auto border-b">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Insumo</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Dosagem</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qtd</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Peso total</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Custo efetivo</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Markup</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Custo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {simResultado.ingredientes.map((ing) => (
                                                <tr key={ing.codigo_interno}>
                                                    <td className="px-4 py-2 text-sm text-gray-900">
                                                        [{ing.codigo_interno}] {ing.descricao}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right text-gray-600">{ing.dosagem_mg} mg</td>
                                                    <td className="px-4 py-2 text-sm text-right text-gray-600">{ing.quantidade}</td>
                                                    <td className="px-4 py-2 text-sm text-right text-gray-600">{ing.peso_total_g.toFixed(4)} g</td>
                                                    <td className="px-4 py-2 text-sm text-right text-gray-600">{moeda(ing.custo_efetivo)}</td>
                                                    <td className="px-4 py-2 text-sm text-right text-gray-600">{ing.markup}x</td>
                                                    <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">{moeda(ing.custo_ingrediente)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="p-6 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total matéria-prima</span>
                                    <span className="font-medium">{moeda(simResultado.total_materia_prima)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        + Taxa de manipulação
                                        {origemBadge(simResultado.condicoes_origem?.taxa_manipulacao)}
                                    </span>
                                    <span className="font-medium">{moeda(simResultado.taxa_manipulacao)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        + Taxa de embalagem
                                        {origemBadge(simResultado.condicoes_origem?.custo_embalagens)}
                                    </span>
                                    <span className="font-medium">{moeda(simResultado.custo_embalagens)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <span className="text-gray-900 font-medium">Subtotal</span>
                                    <span className="font-medium">{moeda(simResultado.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        − Desconto ({(simResultado.desconto_parceiro_pct * 100).toFixed(1)}%)
                                        {origemBadge(simResultado.condicoes_origem?.desconto_parceiro)}
                                    </span>
                                    <span className="font-medium text-red-600">− {moeda(simResultado.desconto_valor)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-900 font-medium">Valor com desconto</span>
                                    <span className="font-medium">{moeda(simResultado.valor_com_desconto)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        + Frete / entrega
                                        {origemBadge(simResultado.condicoes_origem?.adicional_entrega)}
                                    </span>
                                    <span className="font-medium">{moeda(simResultado.adicional_entrega)}</span>
                                </div>
                                {simResultado.adicional_biscoito > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            + Adicional biscoito
                                            {origemBadge(simResultado.condicoes_origem?.adicional_biscoito)}
                                        </span>
                                        <span className="font-medium">{moeda(simResultado.adicional_biscoito)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-3 border-t">
                                    <span className="text-lg font-semibold text-gray-900">Valor final</span>
                                    <span className="text-2xl font-bold text-teal-700">{moeda(simResultado.valor_final)}</span>
                                </div>
                            </div>

                            {simResultado.avisos.length > 0 && (
                                <div className="px-6 py-4 bg-amber-50 border-t border-amber-200">
                                    <p className="text-xs font-medium text-amber-800 mb-1">Avisos</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                                        {simResultado.avisos.map((aviso, i) => (
                                            <li key={i}>{aviso}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal: Novo / Editar Insumo */}
            {showInsumoForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold">
                                {insumoEditando ? 'Editar Insumo' : 'Novo Insumo'}
                            </h3>
                            <button onClick={fecharInsumoForm}>
                                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Interno</label>
                                    <input
                                        type="number"
                                        name="codigo_interno"
                                        value={insumoForm.codigo_interno}
                                        onChange={handleInsumoFormChange}
                                        step="1"
                                        min="1"
                                        placeholder="665"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Código do sistema PharmoPet</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                    <input
                                        type="text"
                                        name="descricao"
                                        value={insumoForm.descricao}
                                        onChange={handleInsumoFormChange}
                                        placeholder="Gabapentina"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
                                    <input
                                        type="number"
                                        name="valor_custo"
                                        value={insumoForm.valor_custo}
                                        onChange={handleInsumoFormChange}
                                        step="0.00001"
                                        min="0"
                                        placeholder="0,00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Custo da última compra, por {insumoForm.un_manipulacao === 'ml' ? 'ml' : 'grama'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Custo de Referência (R$)</label>
                                    <input
                                        type="number"
                                        name="custo_referencia"
                                        value={insumoForm.custo_referencia}
                                        onChange={handleInsumoFormChange}
                                        step="0.00001"
                                        min="0"
                                        placeholder="0,00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">O cálculo usa o maior entre os dois</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Markup</label>
                                    <input
                                        type="number"
                                        name="markup"
                                        value={insumoForm.markup}
                                        onChange={handleInsumoFormChange}
                                        step="0.01"
                                        min="0"
                                        placeholder="648"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Em centésimos: 648 = 6,48x</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                                    <select
                                        name="un_manipulacao"
                                        value={insumoForm.un_manipulacao}
                                        onChange={handleInsumoFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    >
                                        {UNIDADES_MANIPULACAO.map((u) => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                                    <input
                                        type="number"
                                        name="estoque"
                                        value={insumoForm.estoque}
                                        onChange={handleInsumoFormChange}
                                        step="0.0001"
                                        min="0"
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Zero marca o insumo como indisponível</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cálculo</label>
                                    <select
                                        name="calculo_tipo"
                                        value={insumoForm.calculo_tipo}
                                        onChange={handleInsumoFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                    >
                                        {TIPOS_CALCULO.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                        {/* Preserva um valor vindo da base que não esteja na lista */}
                                        {insumoForm.calculo_tipo && !TIPOS_CALCULO.includes(insumoForm.calculo_tipo) && (
                                            <option value={insumoForm.calculo_tipo}>{insumoForm.calculo_tipo}</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 border-t space-y-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        name="controlado"
                                        checked={insumoForm.controlado}
                                        onChange={handleInsumoFormChange}
                                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    Substância controlada
                                </label>
                                {insumoForm.controlado && (
                                    <div className="sm:w-1/2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Lista de Controle</label>
                                        <select
                                            name="lista_controle"
                                            value={insumoForm.lista_controle}
                                            onChange={handleInsumoFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="">Selecione a lista...</option>
                                            {LISTAS_CONTROLE.map((l) => (
                                                <option key={l} value={l}>{l}</option>
                                            ))}
                                            {insumoForm.lista_controle && !LISTAS_CONTROLE.includes(insumoForm.lista_controle) && (
                                                <option value={insumoForm.lista_controle}>{insumoForm.lista_controle}</option>
                                            )}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {insumoFormErro && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                                    {insumoFormErro}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white">
                            <button onClick={fecharInsumoForm} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSalvarInsumo}
                                disabled={salvandoInsumo}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
                            >
                                {salvandoInsumo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {salvandoInsumo ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Incluir / Editar Controlado */}
            {showControladoForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">
                                {controladoAlvo?.controlado ? 'Alterar Lista de Controle' : 'Incluir Controlado'}
                            </h3>
                            <button onClick={() => { setShowControladoForm(false); setControladoAlvo(null); }}>
                                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Insumo</label>
                            {controladoAlvo ? (
                                <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg">
                                    <span className="text-sm font-medium">
                                        [{controladoAlvo.codigo_interno}] {controladoAlvo.descricao}
                                    </span>
                                    <button onClick={() => setControladoAlvo(null)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={controladoBusca}
                                            onChange={(e) => setControladoBusca(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleBuscarInsumoControlado()}
                                            placeholder="Buscar insumo por nome ou código..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                        />
                                        <button onClick={handleBuscarInsumoControlado} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                                            <Search className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {controladoResultados.length > 0 && (
                                        <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                                            {controladoResultados.map((ins) => (
                                                <button
                                                    key={ins.id}
                                                    onClick={() => { setControladoAlvo(ins); setControladoLista(ins.lista_controle || ''); setControladoResultados([]); }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                                >
                                                    [{ins.codigo_interno}] {ins.descricao}
                                                    {ins.controlado && (
                                                        <span className="ml-2 text-xs text-amber-600">já controlado ({ins.lista_controle})</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lista de Controle</label>
                            <select
                                value={controladoLista}
                                onChange={(e) => setControladoLista(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">Selecione a lista...</option>
                                {LISTAS_CONTROLE.map((l) => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                                {controladoLista && !LISTAS_CONTROLE.includes(controladoLista) && (
                                    <option value={controladoLista}>{controladoLista}</option>
                                )}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                Define o alerta de receituário especial que o veterinário vê na prescrição.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => { setShowControladoForm(false); setControladoAlvo(null); }}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSalvarControlado}
                                disabled={!controladoAlvo || !controladoLista || salvandoControlado}
                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
                            >
                                {salvandoControlado ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {salvandoControlado ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
