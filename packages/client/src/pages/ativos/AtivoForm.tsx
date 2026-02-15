import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { api } from '../../services/api';

const especieOptions = [
  { value: 'CANINO', label: 'Canino' },
  { value: 'FELINO', label: 'Felino' },
  { value: 'EQUINO', label: 'Equino' },
  { value: 'BOVINO', label: 'Bovino' },
  { value: 'AVIAR', label: 'Aviar' },
  { value: 'SILVESTRE', label: 'Silvestre' },
];

const formaOptions = [
  { value: 'CAPSULA', label: 'Capsula' },
  { value: 'COMPRIMIDO', label: 'Comprimido' },
  { value: 'LIQUIDO', label: 'Liquido' },
  { value: 'BISCOITO', label: 'Biscoito' },
  { value: 'PASTA', label: 'Pasta' },
  { value: 'POMADA', label: 'Pomada' },
  { value: 'OLEO', label: 'Oleo' },
];

const unidadeOptions = [
  { value: 'MG', label: 'mg' },
  { value: 'G', label: 'g' },
  { value: 'ML', label: 'ml' },
  { value: 'MCG', label: 'mcg' },
];

interface Concentracao {
  valor: number;
  unidade: string;
  forma_farmaceutica: string;
}

interface Faixa {
  especie: string;
  dose_min_mg_kg: number;
  dose_max_mg_kg: number;
  frequencia_horas?: number;
  fonte_referencia?: string;
}

export function AtivoForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [nome, setNome] = useState('');
  const [classe, setClasse] = useState('');
  const [controlado, setControlado] = useState(false);
  const [descricao, setDescricao] = useState('');

  const [concentracoes, setConcentracoes] = useState<Concentracao[]>([
    { valor: 0, unidade: 'MG', forma_farmaceutica: 'CAPSULA' },
  ]);

  const [faixas, setFaixas] = useState<Faixa[]>([
    { especie: 'CANINO', dose_min_mg_kg: 0, dose_max_mg_kg: 0 },
  ]);

  const addConcentracao = () => {
    setConcentracoes([...concentracoes, { valor: 0, unidade: 'MG', forma_farmaceutica: 'CAPSULA' }]);
  };

  const removeConcentracao = (i: number) => {
    setConcentracoes(concentracoes.filter((_, idx) => idx !== i));
  };

  const addFaixa = () => {
    setFaixas([...faixas, { especie: 'CANINO', dose_min_mg_kg: 0, dose_max_mg_kg: 0 }]);
  };

  const removeFaixa = (i: number) => {
    setFaixas(faixas.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/principios-ativos', {
        nome_padronizado: nome,
        classe_terapeutica: classe || undefined,
        controlado,
        descricao_palatavel: descricao || undefined,
        concentracoes: concentracoes.filter((c) => c.valor > 0),
        faixas: faixas.filter((f) => f.dose_min_mg_kg > 0 && f.dose_max_mg_kg > 0),
      });
      navigate('/ativos');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/ativos')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Principio Ativo</h1>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados basicos */}
        <Card title="Dados Basicos">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome Padronizado" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Prednisolona" />
            <Input label="Classe Terapeutica" value={classe} onChange={(e) => setClasse(e.target.value)} placeholder="Ex: Corticosteroide" />
          </div>
          <div className="mt-4">
            <Input label="Descricao Palatavel" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Explicacao simplificada do que faz..." />
          </div>
          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input type="checkbox" checked={controlado} onChange={(e) => setControlado(e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-700">Medicamento controlado (requer receita especial)</span>
          </label>
        </Card>

        {/* Concentracoes */}
        <Card title="Concentracoes Validas" action={
          <Button type="button" variant="outline" size="sm" onClick={addConcentracao}>
            <Plus className="w-4 h-4 mr-1" />Adicionar
          </Button>
        }>
          <div className="space-y-3">
            {concentracoes.map((c, i) => (
              <div key={i} className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label={i === 0 ? 'Valor' : undefined}
                    type="number"
                    step="any"
                    value={c.valor || ''}
                    onChange={(e) => {
                      const updated = [...concentracoes];
                      updated[i] = { ...c, valor: Number(e.target.value) };
                      setConcentracoes(updated);
                    }}
                    placeholder="10"
                  />
                </div>
                <div className="w-24">
                  <Select
                    label={i === 0 ? 'Unidade' : undefined}
                    options={unidadeOptions}
                    value={c.unidade}
                    onChange={(e) => {
                      const updated = [...concentracoes];
                      updated[i] = { ...c, unidade: e.target.value };
                      setConcentracoes(updated);
                    }}
                  />
                </div>
                <div className="w-40">
                  <Select
                    label={i === 0 ? 'Forma' : undefined}
                    options={formaOptions}
                    value={c.forma_farmaceutica}
                    onChange={(e) => {
                      const updated = [...concentracoes];
                      updated[i] = { ...c, forma_farmaceutica: e.target.value };
                      setConcentracoes(updated);
                    }}
                  />
                </div>
                {concentracoes.length > 1 && (
                  <button type="button" onClick={() => removeConcentracao(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mb-0.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Faixas Terapeuticas */}
        <Card title="Faixas Terapeuticas" action={
          <Button type="button" variant="outline" size="sm" onClick={addFaixa}>
            <Plus className="w-4 h-4 mr-1" />Adicionar
          </Button>
        }>
          <div className="space-y-4">
            {faixas.map((f, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-end gap-3">
                  <div className="w-36">
                    <Select
                      label="Especie"
                      options={especieOptions}
                      value={f.especie}
                      onChange={(e) => {
                        const updated = [...faixas];
                        updated[i] = { ...f, especie: e.target.value };
                        setFaixas(updated);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Dose Min (mg/kg)"
                      type="number"
                      step="any"
                      value={f.dose_min_mg_kg || ''}
                      onChange={(e) => {
                        const updated = [...faixas];
                        updated[i] = { ...f, dose_min_mg_kg: Number(e.target.value) };
                        setFaixas(updated);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Dose Max (mg/kg)"
                      type="number"
                      step="any"
                      value={f.dose_max_mg_kg || ''}
                      onChange={(e) => {
                        const updated = [...faixas];
                        updated[i] = { ...f, dose_max_mg_kg: Number(e.target.value) };
                        setFaixas(updated);
                      }}
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      label="Freq (h)"
                      type="number"
                      value={f.frequencia_horas || ''}
                      onChange={(e) => {
                        const updated = [...faixas];
                        updated[i] = { ...f, frequencia_horas: Number(e.target.value) || undefined };
                        setFaixas(updated);
                      }}
                      placeholder="12"
                    />
                  </div>
                  {faixas.length > 1 && (
                    <button type="button" onClick={() => removeFaixa(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  <Input
                    label="Fonte/Referencia"
                    value={f.fonte_referencia || ''}
                    onChange={(e) => {
                      const updated = [...faixas];
                      updated[i] = { ...f, fonte_referencia: e.target.value };
                      setFaixas(updated);
                    }}
                    placeholder="Ex: Plumb's Veterinary Drug Handbook"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/ativos')}>Cancelar</Button>
          <Button type="submit" loading={loading}>Salvar Principio Ativo</Button>
        </div>
      </form>
    </div>
  );
}
