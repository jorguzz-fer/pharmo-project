"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.PrescricaoController = void 0;
var client_1 = require("@prisma/client");
var zod_1 = require("zod");
var prisma = new client_1.PrismaClient();
var PrescricaoController = /** @class */ (function () {
    function PrescricaoController() {
    }
    PrescricaoController.prototype.create = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var schema, CONTROLLED_SUBSTANCES, data_1, isControlled, mockPrice_1, result, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        schema = zod_1.z.object({
                            veterinario_id: zod_1.z.string().uuid(),
                            tutor_id: zod_1.z.string().uuid(),
                            animal_id: zod_1.z.string().uuid(),
                            doenca: zod_1.z.string().optional(),
                            medicamento: zod_1.z.string(),
                            dosagem: zod_1.z.string(),
                            forma_farmaceutica: zod_1.z.string(),
                            quantidade: zod_1.z.string(),
                            observacoes: zod_1.z.string().optional(),
                        });
                        CONTROLLED_SUBSTANCES = ['Morfina', 'Tramadol', 'Diazepam', 'Ketamina'];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        data_1 = schema.parse(req.body);
                        isControlled = CONTROLLED_SUBSTANCES.some(function (sub) {
                            return data_1.medicamento.toLowerCase().includes(sub.toLowerCase());
                        });
                        if (isControlled) {
                            // Exige número de notificação nas observações
                            if (!data_1.observacoes || !data_1.observacoes.toLowerCase().includes('notificação')) {
                                return [2 /*return*/, res.status(400).json({
                                        error: 'Para medicamentos controlados, é obrigatório informar o número da Notificação de Receita nas observações.'
                                    })];
                            }
                        }
                        mockPrice_1 = 150.00 + (Math.random() * 100);
                        return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                var prescricao, orcamento;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, tx.prescricao.create({
                                                data: __assign(__assign({}, data_1), { status: 'DRAFT' }),
                                            })];
                                        case 1:
                                            prescricao = _a.sent();
                                            return [4 /*yield*/, tx.orcamento.create({
                                                    data: {
                                                        prescricao_id: prescricao.id,
                                                        valor_total: mockPrice_1,
                                                        status_pagamento: 'PENDING',
                                                    },
                                                })];
                                        case 2:
                                            orcamento = _a.sent();
                                            return [2 /*return*/, { prescricao: prescricao, orcamento: orcamento }];
                                    }
                                });
                            }); })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, res.status(201).json(result)];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof zod_1.z.ZodError) {
                            return [2 /*return*/, res.status(400).json({ error: error_1.errors })];
                        }
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PrescricaoController.prototype.listByVet = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var vetId, prescricoes, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        vetId = req.userId;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, prisma.prescricao.findMany({
                                where: { veterinario_id: vetId },
                                include: {
                                    tutor: true,
                                    animal: true,
                                    orcamento: true,
                                },
                                orderBy: { created_at: 'desc' },
                                take: 20
                            })];
                    case 2:
                        prescricoes = _a.sent();
                        return [2 /*return*/, res.json(prescricoes)];
                    case 3:
                        error_2 = _a.sent();
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PrescricaoController.prototype.sendToClient = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, prescricao, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, prisma.prescricao.update({
                                where: { id: id },
                                data: { status: 'SENT' }
                            })];
                    case 2:
                        prescricao = _a.sent();
                        // Mock sending Logic (WhatsApp integration comes later)
                        console.log("[WHATSAPP MOCK] Sending prescription ".concat(id, " to client..."));
                        return [2 /*return*/, res.json({ success: true, message: 'Prescrição enviada com sucesso', prescricao: prescricao })];
                    case 3:
                        error_3 = _a.sent();
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PrescricaoController.prototype.getOrderStatus = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, orcamento, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, prisma.orcamento.findFirst({
                                where: { prescricao_id: id },
                                include: {
                                    prescricao: {
                                        include: {
                                            tutor: true,
                                            animal: true
                                        }
                                    },
                                    pedido: true
                                }
                            })];
                    case 2:
                        orcamento = _a.sent();
                        if (!orcamento) {
                            return [2 /*return*/, res.status(404).json({ error: 'Pedido não encontrado' })];
                        }
                        return [2 /*return*/, res.json({
                                orcamento: {
                                    id: orcamento.id,
                                    valor_total: orcamento.valor_total,
                                    status_pagamento: orcamento.status_pagamento,
                                    link_pagamento: orcamento.link_pagamento,
                                    data_pagamento: orcamento.data_pagamento,
                                    prescricao: orcamento.prescricao
                                },
                                pedido: orcamento.pedido
                            })];
                    case 3:
                        error_4 = _a.sent();
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return PrescricaoController;
}());
exports.PrescricaoController = PrescricaoController;
