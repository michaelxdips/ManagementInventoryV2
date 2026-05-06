// Real-time Notification Service using Server-Sent Events (SSE)

class NotificationService {
    constructor() {
        // Store client connections: { userId: { role, connections: Set(response_object) } }
        this.clients = new Map();
    }

    // Add a new client connection with their role
    addClient(userId, res, role) {
        if (!this.clients.has(userId)) {
            this.clients.set(userId, { role, connections: new Set() });
        }
        const client = this.clients.get(userId);
        client.role = role; // Update role in case it changed
        client.connections.add(res);

        // Keep connection alive
        const keepAlive = setInterval(() => {
            res.write(':\n\n'); // SSE comment to keep socket open
        }, 30000);

        // Cleanup on disconnect
        res.on('close', () => {
            clearInterval(keepAlive);
            this.removeClient(userId, res);
        });
    }

    // Remove a closed connection
    removeClient(userId, res) {
        const client = this.clients.get(userId);
        if (client) {
            client.connections.delete(res);
            if (client.connections.size === 0) {
                this.clients.delete(userId);
            }
        }
    }

    writeEvent(userId, res, dataString) {
        try {
            if (res.destroyed || res.writableEnded) {
                this.removeClient(userId, res);
                return;
            }
            res.write(dataString);
        } catch (error) {
            console.error('SSE write error:', error);
            this.removeClient(userId, res);
        }
    }

    // Send event to a specific user (e.g., when their request is approved)
    sendToUser(userId, event, payload) {
        const client = this.clients.get(userId);
        if (client) {
            const dataString = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
            client.connections.forEach(res => this.writeEvent(userId, res, dataString));
        }
    }

    // Send event only to admin/superadmin users (e.g., new request notification)
    broadcastToAdmins(event, payload) {
        const dataString = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
        this.clients.forEach((client, userId) => {
            if (client.role === 'admin' || client.role === 'superadmin') {
                client.connections.forEach(res => this.writeEvent(userId, res, dataString));
            }
        });
    }

    // Send event to ALL connected users (use sparingly)
    broadcast(event, payload) {
        const dataString = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
        this.clients.forEach((client, userId) => {
            client.connections.forEach(res => this.writeEvent(userId, res, dataString));
        });
    }
}

// Singleton instance
const notificationService = new NotificationService();
export default notificationService;

