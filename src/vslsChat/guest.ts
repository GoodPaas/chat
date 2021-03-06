import * as vsls from "vsls";
import { REQUEST_NAME, NOTIFICATION_NAME } from "./utils";
import { VslsBaseService } from "./base";

export class VslsGuestService extends VslsBaseService {
    constructor(
        private api: vsls.LiveShare,
        private serviceProxy: vsls.SharedServiceProxy,
        protected currentUser: User,
        private peer: vsls.Peer
    ) {
        super(currentUser);
        serviceProxy.onNotify(NOTIFICATION_NAME.message, (msg: any) => this.updateMessages(msg));

        serviceProxy.onNotify(NOTIFICATION_NAME.typing, ({ userId }: any) => this.showTyping(userId));

        serviceProxy.onDidChangeIsServiceAvailable((available: boolean) => {
            // Service availability changed
            // TODO
        });

        if (serviceProxy.isServiceAvailable) {
            this.registerSelf();
        }
    }

    async dispose() {}

    registerSelf() {
        // The host is not able to identify peers, because liveshare.peers
        // apparently returns stale data. Till then, we will use a registration
        // mechanism whenever a guest connects to the shared service
        this.serviceProxy.request(REQUEST_NAME.registerGuest, [{ peer: this.peer }]);
    }

    isConnected() {
        return !!this.serviceProxy ? this.serviceProxy.isServiceAvailable : false;
    }

    async fetchUsers(): Promise<Users> {
        if (this.serviceProxy.isServiceAvailable) {
            const response = await this.serviceProxy.request(REQUEST_NAME.fetchUsers, []);
            return response;
        }

        return Promise.resolve({});
    }

    async fetchUserInfo(userId: string): Promise<User | undefined> {
        if (this.serviceProxy.isServiceAvailable) {
            const response = await this.serviceProxy.request(REQUEST_NAME.fetchUserInfo, [userId]);
            return response;
        }
    }

    async fetchMessagesHistory(): Promise<ChannelMessages> {
        if (this.serviceProxy.isServiceAvailable) {
            const response = await this.serviceProxy.request(REQUEST_NAME.fetchMessages, []);
            return response;
        }

        return Promise.resolve({});
    }

    async sendMessage(text: string, userId: string, channelId: string) {
        const payload = { text, userId };

        try {
            if (this.serviceProxy.isServiceAvailable) {
                await this.serviceProxy.request(REQUEST_NAME.message, [payload]);
                return Promise.resolve();
            }
        } catch (error) {
            console.log("Send message error", error);
        }
    }

    async sendTyping(userId: string) {
        const payload = { userId };

        try {
            if (this.serviceProxy.isServiceAvailable) {
                await this.serviceProxy.request(REQUEST_NAME.typing, [payload]);
                return Promise.resolve();
            }
        } catch (error) {
            console.log("Send message error", error);
        }
    }
}
