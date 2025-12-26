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
exports.ClinicaService = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var ClinicaService = /** @class */ (function () {
    function ClinicaService() {
    }
    ClinicaService.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var cnpjLimpo;
            return __generator(this, function (_a) {
                cnpjLimpo = data.cnpj.replace(/\D/g, '');
                return [2 /*return*/, prisma.clinica.create({
                        data: __assign(__assign({}, data), { cnpj: cnpjLimpo })
                    })];
            });
        });
    };
    ClinicaService.prototype.list = function () {
        return __awaiter(this, arguments, void 0, function (filters) {
            var where;
            if (filters === void 0) { filters = {}; }
            return __generator(this, function (_a) {
                where = {};
                if (filters.status) {
                    where.status = filters.status;
                }
                if (filters.cidade) {
                    where.cidade = filters.cidade;
                }
                if (filters.search) {
                    where.OR = [
                        { nome_fantasia: { contains: filters.search, mode: 'insensitive' } },
                        { razao_social: { contains: filters.search, mode: 'insensitive' } },
                        { cnpj: { contains: filters.search } }
                    ];
                }
                return [2 /*return*/, prisma.clinica.findMany({
                        where: where,
                        include: {
                            _count: {
                                select: {
                                    veterinarios: true,
                                    prescricoes: true,
                                    documentos: true
                                }
                            }
                        },
                        orderBy: { created_at: 'desc' }
                    })];
            });
        });
    };
    ClinicaService.prototype.getById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.clinica.findUnique({
                        where: { id: id },
                        include: {
                            documentos: {
                                orderBy: { created_at: 'desc' }
                            },
                            veterinarios: {
                                where: { status: 'ativo' },
                                include: {
                                    veterinario: {
                                        select: {
                                            id: true,
                                            nome: true,
                                            crv: true,
                                            email: true,
                                            telefone: true,
                                            especialidades: true
                                        }
                                    }
                                }
                            },
                            prescricoes: {
                                take: 20,
                                orderBy: { created_at: 'desc' },
                                include: {
                                    tutor: { select: { nome: true } },
                                    animal: { select: { nome: true, especie: true } },
                                    veterinario: { select: { nome: true } }
                                }
                            },
                            _count: {
                                select: {
                                    veterinarios: true,
                                    prescricoes: true,
                                    documentos: true
                                }
                            }
                        }
                    })];
            });
        });
    };
    ClinicaService.prototype.update = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.clinica.update({
                        where: { id: id },
                        data: __assign(__assign({}, data), { updated_at: new Date() })
                    })];
            });
        });
    };
    ClinicaService.prototype.updateStatus = function (id, status, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var updateData, clinica, EmailService, emailService;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updateData = {
                            status: status,
                            updated_at: new Date()
                        };
                        if (status === client_1.ClinicaStatus.APROVADA) {
                            updateData.approved_at = new Date();
                            updateData.approved_by = userId;
                        }
                        return [4 /*yield*/, prisma.clinica.update({
                                where: { id: id },
                                data: updateData
                            })];
                    case 1:
                        clinica = _a.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./email.service'); })];
                    case 2:
                        EmailService = (_a.sent()).EmailService;
                        emailService = new EmailService();
                        if (!(status === client_1.ClinicaStatus.APROVADA)) return [3 /*break*/, 4];
                        return [4 /*yield*/, emailService.sendClinicaAprovada(clinica)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        if (!(status === client_1.ClinicaStatus.SUSPENSA)) return [3 /*break*/, 6];
                        return [4 /*yield*/, emailService.sendClinicaSuspensa(clinica)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, clinica];
                }
            });
        });
    };
    ClinicaService.prototype.softDelete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.clinica.update({
                        where: { id: id },
                        data: {
                            status: client_1.ClinicaStatus.INATIVA,
                            updated_at: new Date()
                        }
                    })];
            });
        });
    };
    ClinicaService.prototype.getMetrics = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, totalPrescricoes, totalFaturamento;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            prisma.prescricao.count({
                                where: { clinica_id: id }
                            }),
                            prisma.orcamento.aggregate({
                                where: {
                                    prescricao: { clinica_id: id }
                                },
                                _sum: { valor_total: true }
                            })
                        ])];
                    case 1:
                        _a = _b.sent(), totalPrescricoes = _a[0], totalFaturamento = _a[1];
                        return [2 /*return*/, {
                                total_prescricoes: totalPrescricoes,
                                total_faturamento: Number(totalFaturamento._sum.valor_total || 0)
                            }];
                }
            });
        });
    };
    return ClinicaService;
}());
exports.ClinicaService = ClinicaService;
