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
exports.PaymentController = void 0;
var client_1 = require("@prisma/client");
var zod_1 = require("zod");
var notification_service_1 = require("../services/notification.service");
var prisma = new client_1.PrismaClient();
var PaymentController = /** @class */ (function () {
    function PaymentController() {
    }
    // 1. Gera Link de Pagamento (Simulação Mercado Pago)
    PaymentController.prototype.generateLink = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var schema, orcamentoId, orcamento, transactionId, fakePaymentLink, fakePixCode, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        schema = zod_1.z.object({
                            orcamentoId: zod_1.z.string().uuid(),
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        orcamentoId = schema.parse(req.body).orcamentoId;
                        return [4 /*yield*/, prisma.orcamento.findUnique({
                                where: { id: orcamentoId },
                                include: { prescricao: { include: { tutor: true } } }
                            })];
                    case 2:
                        orcamento = _a.sent();
                        if (!orcamento) {
                            return [2 /*return*/, res.status(404).json({ error: 'Orçamento não encontrado' })];
                        }
                        if (orcamento.status_pagamento === 'PAID') {
                            return [2 /*return*/, res.status(400).json({ error: 'Orçamento já pago' })];
                        }
                        transactionId = "txn_".concat(Date.now());
                        fakePaymentLink = "https://pay.pharmo.com.br/".concat(transactionId);
                        fakePixCode = "00020126580014BR.GOV.BCB.PIX0136valid-pix-key-1235204000053039865802BR5913Pharmo Pet6008Sao Paulo62070503***6304";
                        // Update Orcamento with Link
                        return [4 /*yield*/, prisma.orcamento.update({
                                where: { id: orcamentoId },
                                data: {
                                    link_pagamento: fakePaymentLink,
                                    status_pagamento: 'PENDING'
                                }
                            })];
                    case 3:
                        // Update Orcamento with Link
                        _a.sent();
                        return [2 /*return*/, res.json({
                                success: true,
                                link: fakePaymentLink,
                                pix_code: fakePixCode,
                                transaction_id: transactionId,
                                expires_in: '30 minutes'
                            })];
                    case 4:
                        error_1 = _a.sent();
                        if (error_1 instanceof zod_1.z.ZodError) {
                            return [2 /*return*/, res.status(400).json({ error: error_1.errors })];
                        }
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // 2. Webhook de Confirmação
    PaymentController.prototype.webhook = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, transaction_id, status, orcamento_id, updatedOrcamento;
            var _this = this;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = req.body, transaction_id = _a.transaction_id, status = _a.status, orcamento_id = _a.orcamento_id;
                        console.log("[WEBHOOK] Received update for ".concat(orcamento_id, " (Tx: ").concat(transaction_id, "): ").concat(status));
                        if (!(status === 'approved')) return [3 /*break*/, 4];
                        return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                var orc, existingPedido, pedido, PrismaFiveService, prismaFiveService, osId, followUpDate;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, tx.orcamento.update({
                                                where: { id: orcamento_id },
                                                data: {
                                                    status_pagamento: 'PAID',
                                                    data_pagamento: new Date(),
                                                    metodo_pagamento: 'PIX'
                                                },
                                                include: {
                                                    prescricao: {
                                                        include: {
                                                            tutor: true,
                                                            animal: true
                                                        }
                                                    }
                                                }
                                            })];
                                        case 1:
                                            orc = _a.sent();
                                            return [4 /*yield*/, tx.pedido.findUnique({
                                                    where: { orcamento_id: orcamento_id }
                                                })];
                                        case 2:
                                            existingPedido = _a.sent();
                                            if (!existingPedido) return [3 /*break*/, 4];
                                            return [4 /*yield*/, tx.pedido.update({
                                                    where: { id: existingPedido.id },
                                                    data: { status_producao: 'PAGAMENTO_CONFIRMADO' }
                                                })];
                                        case 3:
                                            pedido = _a.sent();
                                            return [3 /*break*/, 6];
                                        case 4: return [4 /*yield*/, tx.pedido.create({
                                                data: {
                                                    orcamento_id: orcamento_id,
                                                    status_producao: 'PAGAMENTO_CONFIRMADO'
                                                }
                                            })];
                                        case 5:
                                            pedido = _a.sent();
                                            _a.label = 6;
                                        case 6: return [4 /*yield*/, Promise.resolve().then(function () { return require('../services/prismaFive.service'); })];
                                        case 7:
                                            PrismaFiveService = (_a.sent()).PrismaFiveService;
                                            prismaFiveService = new PrismaFiveService();
                                            return [4 /*yield*/, prismaFiveService.sendOrderToProduction(pedido.id, {
                                                    medicamento: orc.prescricao.medicamento,
                                                    dosagem: orc.prescricao.dosagem,
                                                    quantidade: orc.prescricao.quantidade,
                                                    tutor: orc.prescricao.tutor.nome,
                                                    animal: orc.prescricao.animal.nome
                                                })];
                                        case 8:
                                            osId = _a.sent();
                                            // 4. Update Order Status to EM_PRODUCAO
                                            return [4 /*yield*/, tx.pedido.update({
                                                    where: { id: pedido.id },
                                                    data: {
                                                        status_producao: 'EM_PRODUCAO',
                                                        data_producao: new Date(),
                                                        observacoes: "OS PrismaFive: ".concat(osId)
                                                    }
                                                })];
                                        case 9:
                                            // 4. Update Order Status to EM_PRODUCAO
                                            _a.sent();
                                            followUpDate = new Date();
                                            followUpDate.setDate(followUpDate.getDate() + 3);
                                            return [4 /*yield*/, tx.followUp.create({
                                                    data: {
                                                        pedido_id: pedido.id,
                                                        mensagem: "Verificar status de produ\u00E7\u00E3o - ".concat(orc.prescricao.medicamento),
                                                        data_contato: followUpDate,
                                                        realizado: false
                                                    }
                                                })];
                                        case 10:
                                            _a.sent();
                                            return [2 /*return*/, orc];
                                    }
                                });
                            }); })];
                    case 1:
                        updatedOrcamento = _d.sent();
                        if (!((_c = (_b = updatedOrcamento === null || updatedOrcamento === void 0 ? void 0 : updatedOrcamento.prescricao) === null || _b === void 0 ? void 0 : _b.tutor) === null || _c === void 0 ? void 0 : _c.telefone)) return [3 /*break*/, 3];
                        return [4 /*yield*/, notification_service_1.notificationService.notifyPaymentConfirmed(updatedOrcamento.prescricao.tutor.telefone, updatedOrcamento.prescricao.tutor.nome, updatedOrcamento.prescricao_id.slice(0, 8) // Short ID for display
                            )];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        console.log("[WEBHOOK] \u2705 Payment confirmed and order sent to production for ".concat(orcamento_id));
                        _d.label = 4;
                    case 4: return [2 /*return*/, res.status(200).send('OK')];
                }
            });
        });
    };
    // 3. Status Check
    PaymentController.prototype.checkStatus = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, orcamento, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = req.params.id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, prisma.orcamento.findUnique({
                                where: { id: id }
                            })];
                    case 2:
                        orcamento = _a.sent();
                        if (!orcamento)
                            return [2 /*return*/, res.status(404).json({ error: 'Not found' })];
                        return [2 /*return*/, res.json({
                                status: orcamento.status_pagamento,
                                paid_at: orcamento.data_pagamento
                            })];
                    case 3:
                        error_2 = _a.sent();
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return PaymentController;
}());
exports.PaymentController = PaymentController;
