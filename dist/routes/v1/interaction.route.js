"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_1 = require("../../middlewares/authentication");
const interaction_controller_1 = require("../../controllers/interaction.controller");
const upload_file_1 = require("../../middlewares/upload-file");
const interactionRoute = express_1.default.Router();
interactionRoute.post('/like/:threadId', authentication_1.authentication, interaction_controller_1.toggleLike);
interactionRoute.post('/follow/:followingId', authentication_1.authentication, interaction_controller_1.toggleFollow);
interactionRoute.get('/replies/:threadId', authentication_1.authentication, interaction_controller_1.getThreadReplies);
interactionRoute.post('/reply/:threadId', authentication_1.authentication, upload_file_1.upload, interaction_controller_1.createReply);
interactionRoute.post('/reply/like/:replyId', authentication_1.authentication, interaction_controller_1.toggleReplyLike);
interactionRoute.delete('/reply/:replyId', authentication_1.authentication, interaction_controller_1.deleteReply);
exports.default = interactionRoute;
