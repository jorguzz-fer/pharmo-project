"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var AdminService = /** @class */ (function () {
    function AdminService() {
    }
    AdminService.prototype.getDashboardMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var today, monthStart, monthEnd, _a, revenueData, pipelineData, topPrescriptions, vetIds, vets, topPerformers, pipelineMap;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        today = new Date();
                        today.setHours(0, 0, 0, 0);
                        monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                        monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
                        return [4 /*yield*/, Promise.all([
                                // 1. Revenue - ALL budgets from current month (not just PAID)
                                prisma.orcamento.aggregate({
                                    where: {
                                        created_at: { gte: monthStart, lte: monthEnd }
                                    },
                                    _sum: { valor_total: true },
                                    _count: { id: true }
                                }),
                                // 2. Production Pipeline - group by prescription status instead
                                prisma.prescricao.groupBy({
                                    by: ['status'],
                                    _count: { id: true }
                                }),
                                // 3. Top Performers (Vets) - Get prescription counts
                                prisma.prescricao.groupBy({
                                    by: ['veterinario_id'],
                                    _count: { id: true },
                                    orderBy: {
                                        _count: {
                                            id: 'desc'
                                        }
                                    },
                                    take: 5
                                })
                            ])];
                    case 1:
                        _a = _b.sent(), revenueData = _a[0], pipelineData = _a[1], topPrescriptions = _a[2];
                        vetIds = topPrescriptions.map(function (p) { return p.veterinario_id; });
                        return [4 /*yield*/, prisma.veterinario.findMany({
                                where: { id: { in: vetIds } },
                                select: { id: true, nome: true, crv: true }
                            })];
                    case 2:
                        vets = _b.sent();
                        topPerformers = topPrescriptions.map(function (p) {
                            var vet = vets.find(function (v) { return v.id === p.veterinario_id; });
                            return {
                                veterinario_id: p.veterinario_id,
                                nome: (vet === null || vet === void 0 ? void 0 : vet.nome) || 'Desconhecido',
                                crv: (vet === null || vet === void 0 ? void 0 : vet.crv) || '-',
                                prescricoes_count: p._count.id
                            };
                        });
                        pipelineMap = {};
                        pipelineData.forEach(function (item) {
                            pipelineMap[item.status] = item._count.id;
                        });
                        return [2 /*return*/, {
                                revenue: {
                                    total: Number(revenueData._sum.valor_total || 0),
                                    count: revenueData._count.id
                                },
                                production_pipeline: pipelineMap,
                                top_performers: topPerformers
                            }];
                }
            });
        });
    };
    AdminService.prototype.getFinancialReport = function (mes) {
        return __awaiter(this, void 0, void 0, function () {
            var now, _a, year, month, startDate, endDate, prescricoes, porVetMap, porVeterinario, totalFaturamento;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        now = new Date();
                        _a = mes ? mes.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1], year = _a[0], month = _a[1];
                        startDate = new Date(year, month - 1, 1);
                        endDate = new Date(year, month, 0, 23, 59, 59);
                        return [4 /*yield*/, prisma.prescricao.findMany({
                                where: {
                                    created_at: { gte: startDate, lte: endDate }
                                },
                                include: {
                                    veterinario: true,
                                    tutor: true,
                                    animal: true,
                                    orcamento: true
                                },
                                orderBy: {
                                    created_at: 'desc'
                                }
                            })];
                    case 1:
                        prescricoes = _b.sent();
                        porVetMap = {};
                        prescricoes.forEach(function (p) {
                            var _a, _b;
                            if (!porVetMap[p.veterinario_id]) {
                                porVetMap[p.veterinario_id] = {
                                    veterinario_id: p.veterinario_id,
                                    nome: p.veterinario.nome,
                                    crv: p.veterinario.crv,
                                    email: p.veterinario.email,
                                    prescricoes_count: 0,
                                    valor_total: 0,
                                    prescricoes: []
                                };
                            }
                            porVetMap[p.veterinario_id].prescricoes_count++;
                            porVetMap[p.veterinario_id].valor_total += Number(((_a = p.orcamento) === null || _a === void 0 ? void 0 : _a.valor_total) || 0);
                            porVetMap[p.veterinario_id].prescricoes.push({
                                id: p.id,
                                data: p.created_at,
                                tutor: p.tutor.nome,
                                animal: p.animal.nome,
                                medicamento: p.medicamento,
                                valor: Number(((_b = p.orcamento) === null || _b === void 0 ? void 0 : _b.valor_total) || 0),
                                status: p.status
                            });
                        });
                        porVeterinario = Object.values(porVetMap);
                        totalFaturamento = porVeterinario.reduce(function (sum, v) { return sum + v.valor_total; }, 0);
                        return [2 /*return*/, {
                                periodo: "".concat(year, "-").concat(String(month).padStart(2, '0')),
                                total_prescricoes: prescricoes.length,
                                total_faturamento: totalFaturamento,
                                por_veterinario: porVeterinario
                            }];
                }
            });
        });
    };
    AdminService.prototype.getFollowUps = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.followUp.findMany({
                        where: { realizado: false },
                        include: {
                            pedido: {
                                include: {
                                    orcamento: {
                                        include: {
                                            prescricao: {
                                                include: { tutor: true, animal: true }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        orderBy: { data_contato: 'asc' }
                    })];
            });
        });
    };
    AdminService.prototype.markFollowUp = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.followUp.update({
                        where: { id: id },
                        data: { realizado: true }
                    })];
            });
        });
    };
    AdminService.prototype.getSalesReports = function () {
        return __awaiter(this, arguments, void 0, function (period) {
            var now, startDate, sales, byVet;
            if (period === void 0) { period = 'day'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        startDate = new Date();
                        if (period === 'month') {
                            startDate.setMonth(now.getMonth() - 1);
                        }
                        else {
                            startDate.setDate(now.getDate() - 1);
                        }
                        return [4 /*yield*/, prisma.orcamento.findMany({
                                where: {
                                    status_pagamento: 'PAID',
                                    data_pagamento: { gte: startDate }
                                },
                                include: {
                                    prescricao: {
                                        include: { veterinario: true }
                                    }
                                }
                            })];
                    case 1:
                        sales = _a.sent();
                        byVet = {};
                        sales.forEach(function (sale) {
                            var vetName = sale.prescricao.veterinario.nome;
                            var value = Number(sale.valor_total);
                            byVet[vetName] = (byVet[vetName] || 0) + value;
                        });
                        return [2 /*return*/, { period: period, totalSales: sales.length, byVet: byVet }];
                }
            });
        });
    };
    return AdminService;
}());
exports.AdminService = AdminService;
