import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import { usePrescricaoStore } from '../../store/prescricao';

// Step labels
const steps = ['Paciente', 'Medicamentos', 'Revisao'];

export function NovaPrescricao() {
  const store = usePrescricaoStore();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleBack = () => {
    if (store.step === 0) {
      store.reset();
      navigate('/prescricoes');
    } else {
      store.setStep(store.step - 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nova Prescricao</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i < store.step ? 'bg-primary-600 text-white' :
              i === store.step ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {i < store.step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm ${i === store.step ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {store.step === 0 && <StepPaciente onNext={() => store.setStep(1)} onError={setError} />}
      {store.step === 1 && <StepMedicamentos onNext={() => store.setStep(2)} onError={setError} />}
      {store.step === 2 && <StepRevisao onError={setError} />}
    </div>
  );
}

// === STEP 1: Paciente ===
function StepPaciente({ onNext, onError }: { onNext: () => void; onError: (e: string) => void }) {
  const store = usePrescricaoStore();
  const [tutores, setTutores] = useState<any[]>([]);
  const [animais, setAnimais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any[]>('/tutores').then((r) => {
      setTutores(r.data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (store.tutor_id) {
      api.get<any[]>(`/animais?tutor_id=${store.tutor_id}`).then((r) => setAnimais(r.data || []));
    }
  }, [store.tutor_id]);

  const handleNext = () => {
    if (!store.tutor_id || !store.animal_id) {
      onError('Selecione tutor e animal');
      return;
    }
    const animal = animais.find((a) => a.id === store.animal_id);
    if (animal && !animal.peso_kg) {
      onError('Animal precisa ter peso cadastrado');
      return;
    }
    onError('');
    onNext();
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Carregando tutores...</div>;

  return (
    <div className="space-y-4">
      <Card title="Selecione o Paciente">
        <div className="space-y-4">
          <Select
            label="Tutor"
            placeholder="Selecione o tutor..."
            options={tutores.map((t) => ({ value: t.id, label: `${t.nome}${t.cpf ? ` (${t.cpf})` : ''}` }))}
            value={store.tutor_id || ''}
            onChange={(e) => { store.setTutor(e.target.value); store.setAnimal(''); }}
          />

          {store.tutor_id && (
            <Select
              label="Animal"
              placeholder="Selecione o animal..."
              options={animais.map((a) => ({
                value: a.id,
                label: `${a.nome} (${a.especie.toLowerCase()}${a.peso_kg ? `, ${Number(a.peso_kg)}kg` : ', SEM PESO'})`,
              }))}
              value={store.animal_id || ''}
              onChange={(e) => store.setAnimal(e.target.value)}
            />
          )}

          <Input
            label="Diagnostico / Indicacao"
            value={store.diagnostico}
            onChange={(e) => store.setDiagnostico(e.target.value)}
            placeholder="Ex: Piodermite superficial"
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!store.tutor_id || !store.animal_id}>
          Proximo <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// === STEP 2: Medicamentos ===
function StepMedicamentos({ onNext, onError }: { onNext: () => void; onError: (e: string) => void }) {
  const store = usePrescricaoStore();
  const [ativos, setAtivos] = useState<any[]>([]);
  const [protocolos, setProtocolos] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/principios-ativos').then((r) => setAtivos(r.data || []));
    api.get<any[]>('/protocolos').then((r) => setProtocolos(r.data || []));
  }, []);

  const addItem = () => {
    store.addItem({
      principio_ativo_id: '',
      principio_ativo_nome: '',
      dose_mg_kg: 0,
      frequencia_horas: 12,
      duracao_dias: 7,
      forma_farmaceutica: 'CAPSULA',
    });
  };

  const loadProtocolo = (protocoloId: string) => {
    const p = protocolos.find((pr) => pr.id === protocoloId);
    if (!p) return;
    store.setProtocolo(protocoloId);
    store.setItens(
      p.itens.map((item: any) => ({
        principio_ativo_id: item.principio_ativo_id,
        principio_ativo_nome: item.principio_ativo?.nome_padronizado || '',
        concentracao_id: item.concentracao_id,
        dose_mg_kg: Number(item.dose_mg_kg),
        frequencia_horas: item.frequencia_horas,
        duracao_dias: item.duracao_dias,
        forma_farmaceutica: 'CAPSULA',
        observacoes: item.observacoes,
      })),
    );
  };

  const handleNext = () => {
    if (store.itens.length === 0) {
      onError('Adicione pelo menos 1 medicamento');
      return;
    }
    if (store.itens.some((it) => !it.principio_ativo_id || it.dose_mg_kg <= 0)) {
      onError('Preencha todos os campos dos medicamentos');
      return;
    }
    onError('');
    onNext();
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => store.setModo('protocolo')}
          className={`px-4 py-2 text-sm rounded-lg border ${store.modo === 'protocolo' ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-600'}`}
        >
          Modo A: Protocolo
        </button>
        <button
          onClick={() => { store.setModo('manual'); store.setProtocolo(null); }}
          className={`px-4 py-2 text-sm rounded-lg border ${store.modo === 'manual' ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-600'}`}
        >
          Modo B: Manual
        </button>
      </div>

      {/* Protocolo selector */}
      {store.modo === 'protocolo' && (
        <Card title="Selecionar Protocolo">
          <Select
            placeholder="Escolha um protocolo..."
            options={protocolos.map((p) => ({ value: p.id, label: `${p.codigo} - ${p.nome}${p.especie_alvo ? ` (${p.especie_alvo})` : ''}` }))}
            value={store.protocolo_id || ''}
            onChange={(e) => loadProtocolo(e.target.value)}
          />
        </Card>
      )}

      {/* Items */}
      <Card title="Medicamentos" action={
        store.modo === 'manual' ? (
          <Button variant="outline" size="sm" onClick={addItem}>+ Adicionar</Button>
        ) : undefined
      }>
        {store.itens.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            {store.modo === 'protocolo' ? 'Selecione um protocolo acima' : 'Clique em "Adicionar" para incluir medicamentos'}
          </div>
        ) : (
          <div className="space-y-4">
            {store.itens.map((item, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Select
                      label="Principio Ativo"
                      placeholder="Selecione..."
                      options={ativos.map((a) => ({ value: a.id, label: a.nome_padronizado }))}
                      value={item.principio_ativo_id}
                      onChange={(e) => {
                        const ativo = ativos.find((a) => a.id === e.target.value);
                        store.updateItem(i, { ...item, principio_ativo_id: e.target.value, principio_ativo_nome: ativo?.nome_padronizado || '' });
                      }}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      label="Dose (mg/kg)"
                      type="number"
                      step="any"
                      value={item.dose_mg_kg || ''}
                      onChange={(e) => store.updateItem(i, { ...item, dose_mg_kg: Number(e.target.value) })}
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      label="Freq (h)"
                      type="number"
                      value={item.frequencia_horas || ''}
                      onChange={(e) => store.updateItem(i, { ...item, frequencia_horas: Number(e.target.value) })}
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      label="Dias"
                      type="number"
                      value={item.duracao_dias || ''}
                      onChange={(e) => store.updateItem(i, { ...item, duracao_dias: Number(e.target.value) })}
                    />
                  </div>
                  {store.modo === 'manual' && (
                    <button onClick={() => store.removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">X</button>
                  )}
                </div>
                {item.observacoes && (
                  <p className="text-xs text-gray-500">Obs: {item.observacoes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Input
        label="Observacoes gerais"
        value={store.observacoes}
        onChange={(e) => store.setObservacoes(e.target.value)}
        placeholder="Observacoes adicionais..."
      />

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={store.itens.length === 0}>
          Revisar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// === STEP 3: Revisao ===
function StepRevisao({ onError }: { onError: (e: string) => void }) {
  const store = usePrescricaoStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [validacao, setValidacao] = useState<any>(null);
  const [prescricaoId, setPrescricaoId] = useState<string | null>(null);
  const [aceiteMotivos, setAceiteMotivos] = useState<Record<string, string>>({});

  const handleCriar = async () => {
    setLoading(true);
    onError('');
    try {
      const res = await api.post<any>('/prescricoes', {
        tutor_id: store.tutor_id,
        animal_id: store.animal_id,
        protocolo_id: store.protocolo_id,
        diagnostico: store.diagnostico || undefined,
        observacoes: store.observacoes || undefined,
        itens: store.itens.map((it, i) => ({
          principio_ativo_id: it.principio_ativo_id,
          concentracao_id: it.concentracao_id,
          dose_mg_kg: it.dose_mg_kg,
          frequencia_horas: it.frequencia_horas,
          duracao_dias: it.duracao_dias,
          forma_farmaceutica: it.forma_farmaceutica,
          observacoes: it.observacoes,
          ordem: i,
        })),
      });

      const id = res.data?.id;
      setPrescricaoId(id);

      // Auto-validate
      const valRes = await api.post<any>(`/prescricoes/${id}/validar`);
      setValidacao(valRes.data);
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAceite = async () => {
    if (!prescricaoId || !validacao) return;
    setLoading(true);

    try {
      const itensFora = validacao.itens
        .filter((it: any) => !it.dentroFaixa)
        .map((it: any) => {
          const prescItem = (validacao as any)._prescricaoItens?.find?.((pi: any) => pi.principio_ativo_id === it.principio_ativo_id);
          return {
            prescricao_item_id: prescItem?.id || it.principio_ativo_id,
            motivo_aceite: aceiteMotivos[it.principio_ativo_id] || 'Decisao clinica do veterinario responsavel',
          };
        });

      await api.post(`/prescricoes/${prescricaoId}/aceite`, { itens_aceite: itensFora });
      // Auto sign
      await api.post(`/prescricoes/${prescricaoId}/assinar`);

      store.reset();
      navigate(`/prescricoes/${prescricaoId}`);
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssinar = async () => {
    if (!prescricaoId) return;
    setLoading(true);
    try {
      await api.post(`/prescricoes/${prescricaoId}/assinar`);
      store.reset();
      navigate(`/prescricoes/${prescricaoId}`);
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Revisao da Prescricao">
        <div className="space-y-3">
          {store.diagnostico && (
            <p className="text-sm"><strong>Diagnostico:</strong> {store.diagnostico}</p>
          )}
          <div className="divide-y">
            {store.itens.map((item, i) => (
              <div key={i} className="py-3">
                <p className="font-medium">{item.principio_ativo_nome || 'Ativo ' + (i + 1)}</p>
                <p className="text-sm text-gray-500">
                  {item.dose_mg_kg}mg/kg | a cada {item.frequencia_horas}h | {item.duracao_dias} dias | {item.forma_farmaceutica.toLowerCase()}
                </p>
              </div>
            ))}
          </div>
          {store.observacoes && (
            <p className="text-sm text-gray-500"><strong>Obs:</strong> {store.observacoes}</p>
          )}
        </div>
      </Card>

      {/* Validation results */}
      {validacao && (
        <Card title="Resultado da Validacao">
          {validacao.valida ? (
            <Alert variant="success">Todas as dosagens estao dentro das faixas terapeuticas.</Alert>
          ) : (
            <div className="space-y-3">
              <Alert variant="warning">
                {validacao.itens_fora_faixa} item(ns) fora da faixa terapeutica. E necessario justificar.
              </Alert>
              {validacao.itens.filter((it: any) => !it.dentroFaixa).map((it: any) => (
                <div key={it.principio_ativo_id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">{it.principio_ativo_nome}</span>
                    <Badge variant="warning">{it.percentualDesvio?.toFixed(1)}% fora</Badge>
                  </div>
                  <p className="text-xs text-yellow-700 mb-2">
                    Prescrito: {it.dose_mg_kg}mg/kg | Faixa: {it.faixa_min}-{it.faixa_max}mg/kg
                  </p>
                  <Input
                    placeholder="Motivo do aceite (minimo 10 caracteres)..."
                    value={aceiteMotivos[it.principio_ativo_id] || ''}
                    onChange={(e) => setAceiteMotivos({ ...aceiteMotivos, [it.principio_ativo_id]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="flex justify-end gap-3">
        {!prescricaoId && (
          <Button onClick={handleCriar} loading={loading}>
            <FileText className="w-4 h-4 mr-2" />Criar e Validar
          </Button>
        )}
        {prescricaoId && validacao?.valida && (
          <Button onClick={handleAssinar} loading={loading} variant="secondary">
            <Check className="w-4 h-4 mr-2" />Assinar Prescricao
          </Button>
        )}
        {prescricaoId && validacao && !validacao.valida && (
          <Button
            onClick={handleAceite}
            loading={loading}
            variant="secondary"
            disabled={validacao.itens.filter((it: any) => !it.dentroFaixa).some((it: any) => (aceiteMotivos[it.principio_ativo_id] || '').length < 10)}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />Aceitar e Assinar
          </Button>
        )}
      </div>
    </div>
  );
}
