import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  createPropostaSchema,
  enviarPropostaSchema,
  createConsultorSchema,
  createMetaSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ==================== CONSULTORES ====================

  app.get("/api/consultores", async (_req, res) => {
    const consultores = await storage.getConsultores();
    res.json(consultores);
  });

  app.get("/api/consultores/:id", async (req, res) => {
    const consultor = await storage.getConsultor(req.params.id);
    if (!consultor) return res.status(404).json({ message: "Consultor não encontrado" });
    res.json(consultor);
  });

  app.post("/api/consultores", async (req, res) => {
    const parsed = createConsultorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const consultor = await storage.createConsultor(parsed.data as any);
    res.status(201).json(consultor);
  });

  app.put("/api/consultores/:id", async (req, res) => {
    const updated = await storage.updateConsultor(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Consultor não encontrado" });
    res.json(updated);
  });

  app.delete("/api/consultores/:id", async (req, res) => {
    const deleted = await storage.deleteConsultor(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Consultor não encontrado" });
    res.json({ message: "Consultor removido" });
  });

  // ==================== PROPOSTAS ====================

  app.get("/api/propostas", async (req, res) => {
    const filters = {
      status: req.query.status as string | undefined,
      estado: req.query.estado as string | undefined,
      consultorId: req.query.consultorId as string | undefined,
    };
    const propostas = await storage.getPropostas(filters);
    res.json(propostas);
  });

  app.get("/api/propostas/dashboard", async (_req, res) => {
    const metrics = await storage.getDashboardMetrics();
    res.json(metrics);
  });

  app.get("/api/propostas/:id", async (req, res) => {
    const proposta = await storage.getProposta(req.params.id);
    if (!proposta) return res.status(404).json({ message: "Proposta não encontrada" });
    res.json(proposta);
  });

  app.post("/api/propostas", async (req, res) => {
    const parsed = createPropostaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const proposta = await storage.createProposta(parsed.data as any);
    res.status(201).json(proposta);
  });

  app.put("/api/propostas/:id", async (req, res) => {
    const updated = await storage.updateProposta(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Proposta não encontrada" });
    res.json(updated);
  });

  app.delete("/api/propostas/:id", async (req, res) => {
    const deleted = await storage.deleteProposta(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Proposta não encontrada" });
    res.json({ message: "Proposta removida" });
  });

  // Enviar proposta
  app.post("/api/propostas/:id/enviar", async (req, res) => {
    const parsed = enviarPropostaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

    const proposta = await storage.getProposta(req.params.id);
    if (!proposta) return res.status(404).json({ message: "Proposta não encontrada" });

    const { metodo } = parsed.data;

    // Log envio(s)
    if (metodo === "EMAIL" || metodo === "AMBOS") {
      if (proposta.clienteEmail) {
        await storage.createEnvio({
          propostaId: proposta.id,
          metodo: "EMAIL",
          destinatario: proposta.clienteEmail,
          status: "ENVIADO",
        });
      }
    }
    if (metodo === "WHATSAPP" || metodo === "AMBOS") {
      if (proposta.clienteWhatsapp) {
        await storage.createEnvio({
          propostaId: proposta.id,
          metodo: "WHATSAPP",
          destinatario: proposta.clienteWhatsapp,
          status: "ENVIADO",
        });
      }
    }

    // Update proposta status
    const updated = await storage.updateProposta(proposta.id, {
      status: "ENVIADA",
      metodoEnvio: metodo,
      dataEnvio: new Date(),
      dataExpiracao: new Date(Date.now() + (proposta.validadeDias || 30) * 86400000),
    });

    res.json(updated);
  });

  // Envios de uma proposta
  app.get("/api/propostas/:id/envios", async (req, res) => {
    const envios = await storage.getEnviosByProposta(req.params.id);
    res.json(envios);
  });

  // ==================== METAS ====================

  app.get("/api/metas", async (_req, res) => {
    const metas = await storage.getMetas();
    res.json(metas);
  });

  app.get("/api/metas/:id", async (req, res) => {
    const meta = await storage.getMeta(req.params.id);
    if (!meta) return res.status(404).json({ message: "Meta não encontrada" });
    res.json(meta);
  });

  app.post("/api/metas", async (req, res) => {
    const parsed = createMetaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const meta = await storage.createMeta(parsed.data as any);
    res.status(201).json(meta);
  });

  app.put("/api/metas/:id", async (req, res) => {
    const updated = await storage.updateMeta(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Meta não encontrada" });
    res.json(updated);
  });

  app.delete("/api/metas/:id", async (req, res) => {
    const deleted = await storage.deleteMeta(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Meta não encontrada" });
    res.json({ message: "Meta removida" });
  });

  return httpServer;
}
