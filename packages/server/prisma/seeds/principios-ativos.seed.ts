import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const principiosAtivosSeed = [
    {
        nome: 'Meloxicam',
        nome_cientifico: 'Meloxicam',
        classe_terapeutica: 'Anti-inflamatório não esteroidal (AINE)',
        controlado: false,
        texto_palatavel: 'Anti-inflamatório e analgésico usado para dor e inflamação em cães e gatos',
        concentracoes: [
            { valor: 0.5, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 1, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 2, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 1.5, unidade: 'mg', forma_farmaceutica: 'ml' }
        ],
        ranges: [
            {
                especie: 'canino',
                dose_min_mg_kg: 0.1,
                dose_max_mg_kg: 0.2,
                frequencia_horas: 24,
                duracao_max_dias: 7,
                observacoes: 'Uso prolongado requer monitoramento renal e hepático'
            },
            {
                especie: 'felino',
                dose_min_mg_kg: 0.05,
                dose_max_mg_kg: 0.1,
                frequencia_horas: 24,
                duracao_max_dias: 3,
                observacoes: 'Uso limitado em gatos devido à toxicidade potencial'
            }
        ]
    },
    {
        nome: 'Tramadol',
        nome_cientifico: 'Tramadol HCl',
        classe_terapeutica: 'Analgésico opioide',
        controlado: true,
        texto_palatavel: 'Analgésico para dor moderada a severa',
        concentracoes: [
            { valor: 50, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 100, unidade: 'mg', forma_farmaceutica: 'comprimido' }
        ],
        ranges: [
            {
                especie: 'canino',
                dose_min_mg_kg: 2,
                dose_max_mg_kg: 5,
                frequencia_horas: 8,
                duracao_max_dias: 14,
                observacoes: 'Pode causar sedação e náusea'
            },
            {
                especie: 'felino',
                dose_min_mg_kg: 1,
                dose_max_mg_kg: 4,
                frequencia_horas: 12,
                duracao_max_dias: 7
            }
        ]
    },
    {
        nome: 'Dipirona',
        nome_cientifico: 'Metamizol sódico',
        classe_terapeutica: 'Analgésico e antipirético',
        controlado: false,
        texto_palatavel: 'Analgésico e antitérmico para dor leve a moderada e febre',
        concentracoes: [
            { valor: 500, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 500, unidade: 'mg', forma_farmaceutica: 'ml' }
        ],
        ranges: [
            {
                especie: 'canino',
                dose_min_mg_kg: 25,
                dose_max_mg_kg: 35,
                frequencia_horas: 12,
                duracao_max_dias: 5
            },
            {
                especie: 'felino',
                dose_min_mg_kg: 20,
                dose_max_mg_kg: 25,
                frequencia_horas: 12,
                duracao_max_dias: 3
            }
        ]
    },
    {
        nome: 'Amoxicilina',
        nome_cientifico: 'Amoxicilina',
        classe_terapeutica: 'Antibiótico (Penicilina)',
        controlado: false,
        texto_palatavel: 'Antibiótico de amplo espectro para infecções bacterianas',
        concentracoes: [
            { valor: 50, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 250, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 500, unidade: 'mg', forma_farmaceutica: 'comprimido' }
        ],
        ranges: [
            {
                especie: 'canino',
                dose_min_mg_kg: 10,
                dose_max_mg_kg: 20,
                frequencia_horas: 12,
                duracao_max_dias: 14,
                observacoes: 'Completar todo o ciclo de tratamento'
            },
            {
                especie: 'felino',
                dose_min_mg_kg: 10,
                dose_max_mg_kg: 15,
                frequencia_horas: 12,
                duracao_max_dias: 10
            }
        ]
    },
    {
        nome: 'Prednisolona',
        nome_cientifico: 'Prednisolona',
        classe_terapeutica: 'Corticosteroide',
        controlado: false,
        texto_palatavel: 'Anti-inflamatório esteroidal para alergias e doenças autoimunes',
        concentracoes: [
            { valor: 5, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 10, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 20, unidade: 'mg', forma_farmaceutica: 'comprimido' }
        ],
        ranges: [
            {
                especie: 'canino',
                dose_min_mg_kg: 0.5,
                dose_max_mg_kg: 2,
                frequencia_horas: 24,
                duracao_max_dias: 30,
                observacoes: 'Reduzir dose gradualmente ao descontinuar. Monitorar glicemia e função adrenal'
            },
            {
                especie: 'felino',
                dose_min_mg_kg: 0.5,
                dose_max_mg_kg: 2,
                frequencia_horas: 24,
                duracao_max_dias: 30,
                observacoes: 'Preferir prednisolona à prednisona em gatos'
            }
        ]
    },
    {
        nome: 'Omeprazol',
        nome_cientifico: 'Omeprazol',
        classe_terapeutica: 'Inibidor de bomba de prótons',
        controlado: false,
        texto_palatavel: 'Protetor gástrico para úlceras e gastrite',
        concentracoes: [
            { valor: 10, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 20, unidade: 'mg', forma_farmaceutica: 'comprimido' }
        ],
        ranges: [
            {
                especie: 'canino',
                dose_min_mg_kg: 0.5,
                dose_max_mg_kg: 1,
                frequencia_horas: 24,
                duracao_max_dias: 30
            },
            {
                especie: 'felino',
                dose_min_mg_kg: 0.5,
                dose_max_mg_kg: 1,
                frequencia_horas: 24,
                duracao_max_dias: 14
            }
        ]
    },
    {
        nome: 'Enrofloxacina',
        nome_cientifico: 'Enrofloxacina',
        classe_terapeutica: 'Antibiótico (Fluoroquinolona)',
        controlado: false,
        texto_palatavel: 'Antibiótico de amplo espectro para infecções bacterianas',
        concentracoes: [
            { valor: 50, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 150, unidade: 'mg', forma_farmaceutica: 'comprimido' }
        ],
        ranges: [
            {
                especie: 'canino',
                dose_min_mg_kg: 5,
                dose_max_mg_kg: 10,
                frequencia_horas: 24,
                duracao_max_dias: 14,
                observacoes: 'Evitar em animais em crescimento (pode afetar cartilagens)'
            },
            {
                especie: 'felino',
                dose_min_mg_kg: 5,
                dose_max_mg_kg: 5,
                frequencia_horas: 24,
                duracao_max_dias: 10,
                observacoes: 'Risco de cegueira em gatos com doses altas'
            }
        ]
    },
    {
        nome: 'Gabapentina',
        nome_cientifico: 'Gabapentina',
        classe_terapeutica: 'Anticonvulsivante e analgésico neuropático',
        controlado: false,
        texto_palatavel: 'Usado para dor neuropática e ansiedade',
        concentracoes: [
            { valor: 100, unidade: 'mg', forma_farmaceutica: 'cápsula' },
            { valor: 300, unidade: 'mg', forma_farmaceutica: 'cápsula' }
        ],
        ranges: [
            {
                especie: 'canino',
                dose_min_mg_kg: 5,
                dose_max_mg_kg: 10,
                frequencia_horas: 8,
                duracao_max_dias: 90,
                observacoes: 'Pode causar sedação inicial'
            },
            {
                especie: 'felino',
                dose_min_mg_kg: 5,
                dose_max_mg_kg: 10,
                frequencia_horas: 12,
                duracao_max_dias: 90
            }
        ]
    },
    {
        nome: 'Metronidazol',
        nome_cientifico: 'Metronidazol',
        classe_terapeutica: 'Antibiótico e antiprotozoário',
        controlado: false,
        texto_palatavel: 'Antibiótico para infecções anaeróbicas e protozoários (Giardia)',
        concentracoes: [
            { valor: 250, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 500, unidade: 'mg', forma_farmaceutica: 'comprimido' }
        ],
        ranges: [
            {
                especie: 'canino',
                dose_min_mg_kg: 10,
                dose_max_mg_kg: 15,
                frequencia_horas: 12,
                duracao_max_dias: 7,
                observacoes: 'Pode causar neurotoxicidade em doses altas ou uso prolongado'
            },
            {
                especie: 'felino',
                dose_min_mg_kg: 10,
                dose_max_mg_kg: 15,
                frequencia_horas: 12,
                duracao_max_dias: 5
            }
        ]
    },
    {
        nome: 'Furosemida',
        nome_cientifico: 'Furosemida',
        classe_terapeutica: 'Diurético de alça',
        controlado: false,
        texto_palatavel: 'Diurético usado para insuficiência cardíaca e edema pulmonar',
        concentracoes: [
            { valor: 20, unidade: 'mg', forma_farmaceutica: 'comprimido' },
            { valor: 40, unidade: 'mg', forma_farmaceutica: 'comprimido' }
        ],
        ranges: [
            {
                especie: 'canino',
                dose_min_mg_kg: 1,
                dose_max_mg_kg: 4,
                frequencia_horas: 12,
                duracao_max_dias: 90,
                observacoes: 'Monitorar eletrólitos (potássio). Pode causar desidratação'
            },
            {
                especie: 'felino',
                dose_min_mg_kg: 1,
                dose_max_mg_kg: 2,
                frequencia_horas: 12,
                duracao_max_dias: 90
            }
        ]
    }
];

async function seedPrincipiosAtivos() {
    console.log('🌱 Iniciando seed de princípios ativos...');

    for (const principio of principiosAtivosSeed) {
        try {
            // Verificar se já existe
            const existe = await prisma.principioAtivo.findUnique({
                where: { nome: principio.nome }
            });

            if (existe) {
                console.log(`⏭️  ${principio.nome} já existe, pulando...`);
                continue;
            }

            // Criar princípio ativo com concentrações e ranges
            await prisma.principioAtivo.create({
                data: {
                    nome: principio.nome,
                    nome_cientifico: principio.nome_cientifico,
                    classe_terapeutica: principio.classe_terapeutica,
                    controlado: principio.controlado,
                    texto_palatavel: principio.texto_palatavel,
                    concentracoes: {
                        create: principio.concentracoes
                    },
                    ranges: {
                        create: principio.ranges
                    }
                }
            });

            console.log(`✅ ${principio.nome} criado com sucesso`);
        } catch (error) {
            console.error(`❌ Erro ao criar ${principio.nome}:`, error);
        }
    }

    console.log('🎉 Seed de princípios ativos concluído!');
}

// Executar seed se chamado diretamente
if (require.main === module) {
    seedPrincipiosAtivos()
        .catch((error) => {
            console.error('Erro no seed:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}

export { seedPrincipiosAtivos };
