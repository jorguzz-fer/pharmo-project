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
exports.DocumentoController = exports.upload = void 0;
var documento_service_1 = require("../services/documento.service");
var multer_1 = require("multer");
var documentoService = new documento_service_1.DocumentoService();
// Configurar multer para memória (buffer)
var storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({ storage: storage });
var DocumentoController = /** @class */ (function () {
    function DocumentoController() {
    }
    DocumentoController.prototype.uploadDocumento = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var clinicaId, tipo_documento, file, userId, tiposPermitidos, documento, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        clinicaId = req.params.id;
                        tipo_documento = req.body.tipo_documento;
                        file = req.file;
                        userId = req.userId;
                        if (!file) {
                            return [2 /*return*/, res.status(400).json({ error: 'Nenhum arquivo enviado' })];
                        }
                        tiposPermitidos = [
                            'contrato_social',
                            'cartao_cnpj',
                            'comprovante_endereco',
                            'contrato_assinado'
                        ];
                        if (!tiposPermitidos.includes(tipo_documento)) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Tipo de documento inválido',
                                    tipos_permitidos: tiposPermitidos
                                })];
                        }
                        return [4 /*yield*/, documentoService.upload(clinicaId, tipo_documento, file, userId)];
                    case 1:
                        documento = _a.sent();
                        return [2 /*return*/, res.status(201).json(documento)];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error uploading document:', error_1);
                        return [2 /*return*/, res.status(500).json({ error: error_1.message || 'Erro ao fazer upload' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DocumentoController.prototype.listDocumentos = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var clinicaId, documentos, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        clinicaId = req.params.id;
                        return [4 /*yield*/, documentoService.list(clinicaId)];
                    case 1:
                        documentos = _a.sent();
                        return [2 /*return*/, res.json(documentos)];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error listing documents:', error_2);
                        return [2 /*return*/, res.status(500).json({ error: 'Erro ao listar documentos' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DocumentoController.prototype.deleteDocumento = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var docId, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        docId = req.params.docId;
                        return [4 /*yield*/, documentoService.delete(docId)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, res.json(result)];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error deleting document:', error_3);
                        return [2 /*return*/, res.status(500).json({ error: error_3.message || 'Erro ao deletar documento' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return DocumentoController;
}());
exports.DocumentoController = DocumentoController;
