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
exports.AdminController = void 0;
var admin_service_1 = require("../services/admin.service");
var adminService = new admin_service_1.AdminService();
var AdminController = /** @class */ (function () {
    function AdminController() {
    }
    // 1. Dashboard Principal (Metricas Gerais)
    AdminController.prototype.getDashboardMetrics = function (_req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var metrics, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, adminService.getDashboardMetrics()];
                    case 1:
                        metrics = _a.sent();
                        return [2 /*return*/, res.json(metrics)];
                    case 2:
                        error_1 = _a.sent();
                        console.error(error_1);
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // 2. Relatório de Vendas
    AdminController.prototype.getSalesReport = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var period, report, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        period = req.query.period;
                        return [4 /*yield*/, adminService.getSalesReports(period || 'day')];
                    case 1:
                        report = _a.sent();
                        return [2 /*return*/, res.json(report)];
                    case 2:
                        error_2 = _a.sent();
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // 2.1. Relatório Financeiro Mensal
    AdminController.prototype.getFinancialReport = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var mes, report, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        mes = req.query.mes;
                        return [4 /*yield*/, adminService.getFinancialReport(mes)];
                    case 1:
                        report = _a.sent();
                        return [2 /*return*/, res.json(report)];
                    case 2:
                        error_3 = _a.sent();
                        console.error(error_3);
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // 3. Follow Ups
    AdminController.prototype.getFollowUps = function (_req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var followUps, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, adminService.getFollowUps()];
                    case 1:
                        followUps = _a.sent();
                        return [2 /*return*/, res.json(followUps)];
                    case 2:
                        error_4 = _a.sent();
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AdminController.prototype.markFollowUp = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, adminService.markFollowUp(id)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, res.status(200).send()];
                    case 2:
                        error_5 = _a.sent();
                        return [2 /*return*/, res.status(500).json({ error: 'Internal server error' })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return AdminController;
}());
exports.AdminController = AdminController;
