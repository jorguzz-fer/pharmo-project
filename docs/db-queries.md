# Queries de Exemplo - Pharmo

Abaixo estão exemplos das principais operações do sistema usando **Prisma ORM** e seus equivalentes em **SQL**.

## 1. Buscar Veterinário por CRV
**Prisma:**
```typescript
const vet = await prisma.veterinario.findUnique({
  where: { crv: '12345' }
});
```

**SQL:**
```sql
SELECT * FROM veterinarios WHERE crv = '12345';
```

## 2. Buscar Tutor com Animais
**Prisma:**
```typescript
const tutor = await prisma.tutor.findUnique({
  where: { cpf: '123.456.789-00' },
  include: { animais: true }
});
```

**SQL:**
```sql
SELECT t.*, a.* 
FROM tutores t
LEFT JOIN animais a ON a.tutor_id = t.id
WHERE t.cpf = '123.456.789-00';
```

## 3. Criar Prescrição (Transação)
**Prisma:**
```typescript
const prescricao = await prisma.prescricao.create({
  data: {
    veterinario_id: 'vet-uuid',
    tutor_id: 'tutor-uuid',
    animal_id: 'animal-uuid',
    medicamento: 'Apoquel',
    dosagem: '5.4mg',
    forma_farmaceutica: 'Comprimido',
    quantidade: '1 caixa',
    orcamento: {
      create: {
        valor_total: 250.00,
        status_pagamento: 'PENDING'
      }
    }
  }
});
```

**SQL:**
```sql
BEGIN;
INSERT INTO prescricoes (id, veterinario_id, ...) VALUES (uuid(), 'vet-uuid', ...);
INSERT INTO orcamentos (id, prescricao_id, valor_total, ...) VALUES (uuid(), 'presc-uuid', 250.00, ...);
COMMIT;
```

## 4. Buscar Prescrições do Veterinário (Filtros)
**Prisma:**
```typescript
const prescricoes = await prisma.prescricao.findMany({
  where: {
    veterinario_id: 'vet-uuid',
    status: 'SENT',
    created_at: {
      gte: new Date('2024-01-01')
    }
  },
  orderBy: { created_at: 'desc' },
  take: 10
});
```

**SQL:**
```sql
SELECT * FROM prescricoes 
WHERE veterinario_id = 'vet-uuid' 
  AND status = 'SENT'
  AND created_at >= '2024-01-01'
ORDER BY created_at DESC
LIMIT 10;
```

## 5. Dashboard Administrativo
**Prisma:**
```typescript
const totalVendas = await prisma.orcamento.aggregate({
  _sum: { valor_total: true },
  where: { status_pagamento: 'PAID' }
});
```

**SQL:**
```sql
SELECT SUM(valor_total) 
FROM orcamentos 
WHERE status_pagamento = 'PAID';
```
