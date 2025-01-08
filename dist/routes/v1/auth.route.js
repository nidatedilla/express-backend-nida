"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../../controllers/auth.controller");
const authRoute = express_1.default.Router();
authRoute.post('/register', auth_controller_1.register);
authRoute.post('/login', auth_controller_1.login);
authRoute.post('/forgot-password', auth_controller_1.forgotPassword);
authRoute.post('/reset-password', auth_controller_1.resetPassword);
exports.default = authRoute;
