import { Request, Response } from 'express';
import { TenantService } from './tenant.service';

const tenantService = new TenantService();

export class TenantController {
  async create(req: Request, res: Response) {
    const result = await tenantService.create(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async findById(req: Request, res: Response) {
    const id = req.params.id || req.clinicaId!;
    const result = await tenantService.findById(id);
    res.json({ success: true, data: result });
  }

  async update(req: Request, res: Response) {
    const id = req.params.id || req.clinicaId!;
    const result = await tenantService.update(id, req.body);
    res.json({ success: true, data: result });
  }

  async updateBranding(req: Request, res: Response) {
    const id = req.params.id || req.clinicaId!;
    const result = await tenantService.updateBranding(id, req.body);
    res.json({ success: true, data: result });
  }

  async getConfig(req: Request, res: Response) {
    const id = req.params.id || req.clinicaId!;
    const result = await tenantService.getConfig(id);
    res.json({ success: true, data: result });
  }
}
