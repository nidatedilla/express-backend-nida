"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../../controllers/user.controller");
const authentication_1 = require("../../middlewares/authentication");
const upload_file_1 = require("../../middlewares/upload-file");
const userRoute = express_1.default.Router();
userRoute.get('/all', authentication_1.authentication, user_controller_1.getAllUsers);
userRoute.get('/', authentication_1.authentication, user_controller_1.getCurrentUser);
userRoute.get('/:id', authentication_1.authentication, user_controller_1.getUserById);
userRoute.put('/', authentication_1.authentication, upload_file_1.upload, user_controller_1.updateUser);
userRoute.delete('/', authentication_1.authentication, user_controller_1.deleteUser);
exports.default = userRoute;
