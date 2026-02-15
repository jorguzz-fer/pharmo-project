import { Request, Response } from 'express';
import { PrincipioAtivoService } from './principio-ativo.service';

const service = new PrincipioAtivoService();

export class PrincipioAtivoController {
  async create(req: Request, res: Response) {
    const result = await service.create(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async findAll(req: Request, res: Response) {
    const search = req.query.search as string | undefined;
    const result = await service.findAll(search);
    res.json({ success: true, data: result });
  }

  async findById(req: Request, res: Response) {
    const result = await service.findById(req.params.id as string);
    res.json({ success: true, data: result });
  }

  async update(req: Request, res: Response) {
    const result = await service.update(req.params.id as string, req.body);
    res.json({ success: true, data: result });
  }

  async delete(req: Request, res: Response) {
    await service.delete(req.params.id as string);
    res.json({ success: true, message: 'Principio ativo removido' });
  }

  // Concentracoes
  async addConcentracao(req: Request, res: Response) {
    const result = await service.addConcentracao(req.params.id as string, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateConcentracao(req: Request, res: Response) {
    const result = await service.updateConcentracao(req.params.id as string, req.params.cid as string, req.body);
    res.json({ success: true, data: result });
  }

  async deleteConcentracao(req: Request, res: Response) {
    await service.deleteConcentracao(req.params.id as string, req.params.cid as string);
    res.json({ success: true, message: 'Concentracao removida' });
  }

  // Faixas
  async addFaixa(req: Request, res: Response) {
    const result = await service.addFaixa(req.params.id as string, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateFaixa(req: Request, res: Response) {
    const result = await service.updateFaixa(req.params.id as string, req.params.fid as string, req.body);
    res.json({ success: true, data: result });
  }

  async deleteFaixa(req: Request, res: Response) {
    await service.deleteFaixa(req.params.id as string, req.params.fid as string);
    res.json({ success: true, message: 'Faixa terapeutica removida' });
  }
}
