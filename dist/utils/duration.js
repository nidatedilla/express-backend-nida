"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = formatDuration;
function formatDuration(createdAt) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
    if (diffInSeconds < 60) {
        return 'Just Now';
    }
    else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}m`;
    }
    else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}h`;
    }
    else if (diffInSeconds < 604800) {
        return `${Math.floor(diffInSeconds / 86400)}d`;
    }
    else {
        const options = {
            month: 'short',
            day: 'numeric',
        };
        return createdAt.toLocaleDateString('en-US', options);
    }
}
