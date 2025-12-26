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
exports.VeterinarioService = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var VeterinarioService = /** @class */ (function () {
    function VeterinarioService() {
    }
    VeterinarioService.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var existente;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Validar CRMV
                        if (!this.validarCRMV(data.crmv)) {
                            throw new Error('CRMV inválido. Formato esperado: CRMV-UF 12345');
                        }
                        return [4 /*yield*/, prisma.veterinario.findFirst({
                                where: {
                                    OR: [
                                        { cpf: data.cpf },
                                        { crv: data.crmv }
                                    ]
                                }
                            })];
                    case 1:
                        existente = _b.sent();
                        if (existente) {
                            if (existente.cpf === data.cpf) {
                                throw new Error('CPF já cadastrado');
                            }
                            if (existente.crv === data.crmv) {
                                throw new Error('CRMV já cadastrado');
                            }
                        }
                        return [2 /*return*/, prisma.veterinario.create({
                                data: __assign(__assign({}, data), { cpf: (_a = data.cpf) === null || _a === void 0 ? void 0 : _a.replace(/\D/g, ''), status: 'ACTIVE' })
                            })];
                }
            });
        });
    };
    VeterinarioService.prototype.list = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.veterinario.findMany({
                        include: {
                            _count: {
                                select: {
                                    prescricoes: true,
                                    clinicas: true
                                }
                            }
                        },
                        orderBy: { created_at: 'desc' }
                    })];
            });
        });
    };
    VeterinarioService.prototype.getById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.veterinario.findUnique({
                        where: { id: id },
                        include: {
                            clinicas: {
                                where: { status: 'ativo' },
                                include: {
                                    clinica: {
                                        select: {
                                            id: true,
                                            nome_fantasia: true,
                                            cidade: true,
                                            estado: true,
                                            status: true
                                        }
                                    }
                                }
                            },
                            prescricoes: {
                                take: 20,
                                orderBy: { created_at: 'desc' },
                                include: {
                                    tutor: { select: { nome: true } },
                                    animal: { select: { nome: true } },
                                    clinica: { select: { nome_fantasia: true } }
                                }
                            },
                            _count: {
                                select: {
                                    prescricoes: true,
                                    clinicas: true
                                }
                            }
                        }
                    })];
            });
        });
    };
    VeterinarioService.prototype.buscar = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var cpfLimpo;
            return __generator(this, function (_a) {
                cpfLimpo = query.replace(/\D/g, '');
                return [2 /*return*/, prisma.veterinario.findFirst({
                        where: {
                            OR: [
                                { crv: { contains: query, mode: 'insensitive' } },
                                { cpf: cpfLimpo }
                            ]
                        },
                        include: {
                            clinicas: {
                                where: { status: 'ativo' },
                                include: {
                                    clinica: {
                                        select: {
                                            id: true,
                                            nome_fantasia: true,
                                            cidade: true,
                                            estado: true
                                        }
                                    }
                                }
                            }
                        }
                    })];
            });
        });
    };
    VeterinarioService.prototype.update = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.veterinario.update({
                        where: { id: id },
                        data: __assign(__assign({}, data), { updated_at: new Date() })
                    })];
            });
        });
    };
    VeterinarioService.prototype.getClinicas = function (veterinarioId) {
        return __awaiter(this, void 0, void 0, function () {
            var vinculacoes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.clinicaVeterinario.findMany({
                            where: {
                                veterinario_id: veterinarioId,
                                status: 'ativo'
                            },
                            include: {
                                clinica: {
                                    select: {
                                        id: true,
                                        nome_fantasia: true,
                                        razao_social: true,
                                        cnpj: true,
                                        cidade: true,
                                        estado: true,
                                        status: true,
                                        telefone: true,
                                        email: true
                                    }
                                }
                            },
                            orderBy: { created_at: 'desc' }
                        })];
                    case 1:
                        vinculacoes = _a.sent();
                        return [2 /*return*/, vinculacoes.map(function (v) { return (__assign(__assign({}, v.clinica), { cargo: v.cargo, data_vinculacao: v.created_at })); })];
                }
            });
        });
    };
    // Validação de CRMV
    VeterinarioService.prototype.validarCRMV = function (crmv) {
        // Formato: CRMV-UF 12345 ou CRMV-UF 123456
        var regex = /^CRMV-[A-Z]{2}\s\d{4,6}$/;
        return regex.test(crmv);
    };
    return VeterinarioService;
}());
exports.VeterinarioService = VeterinarioService;
