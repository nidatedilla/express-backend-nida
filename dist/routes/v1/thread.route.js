"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const thread_controller_1 = require("../../controllers/thread.controller");
const authentication_1 = require("../../middlewares/authentication");
const upload_file_1 = require("../../middlewares/upload-file");
const threadRoute = express_1.default.Router();
threadRoute.get('/', authentication_1.authentication, thread_controller_1.getAllThreads);
threadRoute.get('/user', authentication_1.authentication, thread_controller_1.getThreadsByUser);
threadRoute.get('/:id', authentication_1.authentication, thread_controller_1.getThreadById);
threadRoute.get('/user/:userId', authentication_1.authentication, thread_controller_1.getThreadsByUserId);
threadRoute.post('/', authentication_1.authentication, upload_file_1.upload, thread_controller_1.createThread);
threadRoute.post('/:id', authentication_1.authentication, upload_file_1.upload, thread_controller_1.updateThread);
threadRoute.delete('/:id', authentication_1.authentication, thread_controller_1.deleteThread);
exports.default = threadRoute;
