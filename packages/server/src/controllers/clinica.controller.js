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
exports.ClinicaController = void 0;
var clinica_service_1 = require("../services/clinica.service");
var zod_1 = require("zod");
var clinicaService = new clinica_service_1.ClinicaService();
var ClinicaController = /** @class */ (function () {
    function ClinicaController() {
    }
    ClinicaController.prototype.create = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var schema, data, clinica, EmailService, emailService, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        schema = zod_1.z.object({
                            nome_fantasia: zod_1.z.string().min(3),
                            razao_social: zod_1.z.string().min(3),
                            cnpj: zod_1.z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
                            inscricao_estadual: zod_1.z.string().optional(),
                            email: zod_1.z.string().email(),
                            telefone: zod_1.z.string().optional(),
                            whatsapp: zod_1.z.string().optional(),
                            cep: zod_1.z.string().optional(),
                            logradouro: zod_1.z.string().optional(),
                            numero: zod_1.z.string().optional(),
                            complemento: zod_1.z.string().optional(),
                            bairro: zod_1.z.string().optional(),
                            cidade: zod_1.z.string().optional(),
                            estado: zod_1.z.string().length(2).optional(),
                            responsavel_legal: zod_1.z.string().min(3),
                            cpf_responsavel: zod_1.z.string(),
                            observacoes_internas: zod_1.z.string().optional()
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        data = schema.parse(req.body);
                        return [4 /*yield*/, clinicaService.create(data)];
                    case 2:
                        clinica = _a.sent();
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../services/email.service'); })];
                    case 3:
                        EmailService = (_a.sent()).EmailService;
                        emailService = new EmailService();
                        return [4 /*yield*/, emailService.sendClinicaCadastrada(clinica)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, res.status(201).json(clinica)];
                    case 5:
                        error_1 = _a.sent();
                        if (error_1 instanceof zod_1.z.ZodError) {
                            return [2 /*return*/, res.status(400).json({ error: error_1.issues })];
                        }
                        console.error('Error creating clinica:', error_1);
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    ClinicaController.prototype.list = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, status_1, cidade, search, clinicas, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = req.query, status_1 = _a.status, cidade = _a.cidade, search = _a.search;
                        return [4 /*yield*/, clinicaService.list({
                                status: status_1,
                                cidade: cidade,
                                search: search
                            })];
                    case 1:
                        clinicas = _b.sent();
                        return [2 /*return*/, res.json(clinicas)];
                    case 2:
                        error_2 = _b.sent();
                        console.error('Error listing clinicas:', error_2);
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ClinicaController.prototype.getById = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, clinica, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, clinicaService.getById(id)];
                    case 1:
                        clinica = _a.sent();
                        if (!clinica) {
                            return [2 /*return*/, res.status(404).json({ error: 'Clínica não encontrada' })];
                        }
                        return [2 /*return*/, res.json(clinica)];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error getting clinica:', error_3);
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ClinicaController.prototype.update = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, clinica, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, clinicaService.update(id, req.body)];
                    case 1:
                        clinica = _a.sent();
                        return [2 /*return*/, res.json(clinica)];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Error updating clinica:', error_4);
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ClinicaController.prototype.updateStatus = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, status_2, userId, clinica, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        status_2 = req.body.status;
                        userId = req.userId;
                        return [4 /*yield*/, clinicaService.updateStatus(id, status_2, userId)];
                    case 1:
                        clinica = _a.sent();
                        return [2 /*return*/, res.json(clinica)];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Error updating status:', error_5);
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ClinicaController.prototype.softDelete = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, clinica, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, clinicaService.softDelete(id)];
                    case 1:
                        clinica = _a.sent();
                        return [2 /*return*/, res.json(clinica)];
                    case 2:
                        error_6 = _a.sent();
                        console.error('Error deleting clinica:', error_6);
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ClinicaController.prototype.getMetrics = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, metrics, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, clinicaService.getMetrics(id)];
                    case 1:
                        metrics = _a.sent();
                        return [2 /*return*/, res.json(metrics)];
                    case 2:
                        error_7 = _a.sent();
                        console.error('Error getting metrics:', error_7);
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Vinculação de Veterinários
    ClinicaController.prototype.vincularVeterinario = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var clinicaId, _a, veterinario_id, cargo, ClinicaVeterinarioService, service, vinculacao, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        clinicaId = req.params.id;
                        _a = req.body, veterinario_id = _a.veterinario_id, cargo = _a.cargo;
                        if (!veterinario_id) {
                            return [2 /*return*/, res.status(400).json({ error: 'veterinario_id é obrigatório' })];
                        }
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../services/clinica-veterinario.service'); })];
                    case 1:
                        ClinicaVeterinarioService = (_b.sent()).ClinicaVeterinarioService;
                        service = new ClinicaVeterinarioService();
                        return [4 /*yield*/, service.vincular(clinicaId, veterinario_id, cargo)];
                    case 2:
                        vinculacao = _b.sent();
                        return [2 /*return*/, res.status(201).json(vinculacao)];
                    case 3:
                        error_8 = _b.sent();
                        console.error('Error vinculando veterinario:', error_8);
                        return [2 /*return*/, res.status(400).json({ error: error_8.message || 'Erro ao vincular veterinário' })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ClinicaController.prototype.desvincularVeterinario = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, clinicaId, vetId, ClinicaVeterinarioService, service, vinculacao, error_9;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        _a = req.params, clinicaId = _a.id, vetId = _a.vetId;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../services/clinica-veterinario.service'); })];
                    case 1:
                        ClinicaVeterinarioService = (_b.sent()).ClinicaVeterinarioService;
                        service = new ClinicaVeterinarioService();
                        return [4 /*yield*/, service.desvincular(clinicaId, vetId)];
                    case 2:
                        vinculacao = _b.sent();
                        return [2 /*return*/, res.json(vinculacao)];
                    case 3:
                        error_9 = _b.sent();
                        console.error('Error desvinculando veterinario:', error_9);
                        return [2 /*return*/, res.status(400).json({ error: error_9.message || 'Erro ao desvincular veterinário' })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ClinicaController.prototype.listarVeterinarios = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var clinicaId, ClinicaVeterinarioService, service, veterinarios, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        clinicaId = req.params.id;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../services/clinica-veterinario.service'); })];
                    case 1:
                        ClinicaVeterinarioService = (_a.sent()).ClinicaVeterinarioService;
                        service = new ClinicaVeterinarioService();
                        return [4 /*yield*/, service.listarVeterinarios(clinicaId)];
                    case 2:
                        veterinarios = _a.sent();
                        return [2 /*return*/, res.json(veterinarios)];
                    case 3:
                        error_10 = _a.sent();
                        console.error('Error listing veterinarios:', error_10);
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return ClinicaController;
}());
exports.ClinicaController = ClinicaController;
