import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const propostaStatusEnum = pgEnum("proposta_status", [
  "RASCUNHO",
  "ENVIADA",
  "VISUALIZADA",
  "ACEITA",
  "RECUSADA",
  "EXPIRADA",
]);

export const metodoEnvioEnum = pgEnum("metodo_envio", [
  "EMAIL",
  "WHATSAPP",
  "AMBOS",
]);

export const envioStatusEnum = pgEnum("envio_status", [
  "ENVIADO",
  "FALHOU",
  "PENDENTE",
]);

// Users (existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Consultores
export const consultores = pgTable("consultores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  idConsultor: text("id_consultor").notNull().unique(),
  email: text("email"),
  whatsapp: text("whatsapp"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Propostas
export const propostas = pgTable("propostas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroProposta: text("numero_proposta").notNull().unique(),
  consultorId: varchar("consultor_id").references(() => consultores.id),

  // Cliente
  clienteNome: text("cliente_nome").notNull(),
  clienteEmail: text("cliente_email"),
  clienteWhatsapp: text("cliente_whatsapp"),
  clienteEmpresa: text("cliente_empresa"),
  clienteCnpj: text("cliente_cnpj"),
  clienteEstado: text("cliente_estado"),
  clienteCidade: text("cliente_cidade"),

  // Conteúdo
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  itens: json("itens").$type<PropostaItem[]>().notNull().default([]),
  valorTotal: decimal("valor_total", { precision: 12, scale: 2 }).notNull().default("0"),
  validadeDias: integer("validade_dias").notNull().default(30),
  observacoes: text("observacoes"),

  // Status
  status: propostaStatusEnum("status").notNull().default("RASCUNHO"),
  metodoEnvio: metodoEnvioEnum("metodo_envio"),
  pdfUrl: text("pdf_url"),

  // Datas
  dataEnvio: timestamp("data_envio"),
  dataVisualizacao: timestamp("data_visualizacao"),
  dataResposta: timestamp("data_resposta"),
  dataExpiracao: timestamp("data_expiracao"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Envios (log de cada tentativa)
export const propostaEnvios = pgTable("proposta_envios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propostaId: varchar("proposta_id").notNull().references(() => propostas.id),
  metodo: metodoEnvioEnum("metodo").notNull(),
  destinatario: text("destinatario").notNull(),
  status: envioStatusEnum("status").notNull().default("PENDENTE"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Metas
export const metasPropostas = pgTable("metas_propostas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodo: text("periodo").notNull(), // "2026-02"
  tipo: text("tipo").notNull().default("mensal"), // mensal, trimestral, anual
  metaValor: decimal("meta_valor", { precision: 12, scale: 2 }),
  metaQuantidade: integer("meta_quantidade"),
  consultorId: varchar("consultor_id").references(() => consultores.id), // null = global
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Types
export interface PropostaItem {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConsultorSchema = createInsertSchema(consultores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropostaSchema = createInsertSchema(propostas).omit({
  id: true,
  numeroProposta: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropostaEnvioSchema = createInsertSchema(propostaEnvios).omit({
  id: true,
  createdAt: true,
});

export const insertMetaPropostaSchema = createInsertSchema(metasPropostas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Zod schemas for API validation
export const createPropostaSchema = z.object({
  consultorId: z.string().optional(),
  clienteNome: z.string().min(1, "Nome do cliente é obrigatório"),
  clienteEmail: z.string().email().optional().or(z.literal("")),
  clienteWhatsapp: z.string().optional(),
  clienteEmpresa: z.string().optional(),
  clienteCnpj: z.string().optional(),
  clienteEstado: z.string().optional(),
  clienteCidade: z.string().optional(),
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().optional(),
  itens: z.array(z.object({
    descricao: z.string().min(1),
    quantidade: z.number().min(1),
    valorUnitario: z.number().min(0),
    valorTotal: z.number().min(0),
  })).default([]),
  valorTotal: z.string().default("0"),
  validadeDias: z.number().min(1).default(30),
  observacoes: z.string().optional(),
  status: z.enum(["RASCUNHO", "ENVIADA", "VISUALIZADA", "ACEITA", "RECUSADA", "EXPIRADA"]).default("RASCUNHO"),
  metodoEnvio: z.enum(["EMAIL", "WHATSAPP", "AMBOS"]).optional(),
});

export const enviarPropostaSchema = z.object({
  metodo: z.enum(["EMAIL", "WHATSAPP", "AMBOS"]),
});

export const createConsultorSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  idConsultor: z.string().min(1, "ID do consultor é obrigatório"),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  ativo: z.boolean().default(true),
});

export const createMetaSchema = z.object({
  periodo: z.string().min(1, "Período é obrigatório"),
  tipo: z.enum(["mensal", "trimestral", "anual"]).default("mensal"),
  metaValor: z.string().optional(),
  metaQuantidade: z.number().optional(),
  consultorId: z.string().optional(),
});

// Inferred types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Consultor = typeof consultores.$inferSelect;
export type InsertConsultor = typeof consultores.$inferInsert;
export type Proposta = typeof propostas.$inferSelect;
export type InsertProposta = typeof propostas.$inferInsert;
export type PropostaEnvio = typeof propostaEnvios.$inferSelect;
export type InsertPropostaEnvio = typeof propostaEnvios.$inferInsert;
export type MetaProposta = typeof metasPropostas.$inferSelect;
export type InsertMetaProposta = typeof metasPropostas.$inferInsert;
