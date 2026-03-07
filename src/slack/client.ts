import type {
    SlackApiResponse,
    SlackChannel,
    SlackChannelsResponse,
    SlackConfig,
    SlackFileInfoResponse,
    SlackMessage,
    SlackMessagesResponse,
    SlackOpenDMResponse,
    SlackPostMessageResponse,
    SlackUser,
    SlackUsersResponse,
} from './types.ts';

const SLACK_API = 'https://slack.com/api';

export class SlackClient {
    private token: string;

    constructor(config: SlackConfig) {
        this.token = config.token;
    }

    private async request<T extends SlackApiResponse>(
        method: string,
        params: Record<string, string> = {},
    ): Promise<T> {
        const response = await fetch(`${SLACK_API}/${method}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(params),
        });

        if (!response.ok) {
            throw new Error(`Slack HTTP error ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as T;
        if (!data.ok) {
            throw new Error(`Slack API error: ${data.error}`);
        }

        return data;
    }

    async getChannels(): Promise<SlackChannel[]> {
        const result = await this.request<SlackChannelsResponse>('conversations.list', {
            types: 'public_channel,private_channel',
            exclude_archived: 'true',
            limit: '200',
        });
        return result.channels;
    }

    async getDMs(): Promise<SlackChannel[]> {
        const result = await this.request<SlackChannelsResponse>('conversations.list', {
            types: 'im',
            limit: '200',
        });
        return result.channels;
    }

    async getUsers(): Promise<SlackUser[]> {
        const result = await this.request<SlackUsersResponse>('users.list', {
            limit: '200',
        });
        return result.members.filter((u) => !u.deleted && !u.is_bot);
    }

    async getMessages(channelId: string, limit = 20): Promise<SlackMessage[]> {
        const result = await this.request<SlackMessagesResponse>('conversations.history', {
            channel: channelId,
            limit: String(limit),
        });
        return result.messages;
    }

    async getThreadReplies(channelId: string, threadTs: string, limit = 20): Promise<SlackMessage[]> {
        const result = await this.request<SlackMessagesResponse>('conversations.replies', {
            channel: channelId,
            ts: threadTs,
            limit: String(limit),
        });
        return result.messages;
    }

    async sendMessage(channelId: string, text: string): Promise<SlackPostMessageResponse> {
        return await this.request<SlackPostMessageResponse>('chat.postMessage', {
            channel: channelId,
            text,
        });
    }

    async openDM(userId: string): Promise<string> {
        const result = await this.request<SlackOpenDMResponse>('conversations.open', {
            users: userId,
        });
        return result.channel.id;
    }

    async getFileContent(fileId: string): Promise<{ name: string; mimetype: string; content: string }> {
        const infoResp = await this.request<SlackFileInfoResponse>('files.info', { file: fileId });
        const file = infoResp.file;
        const downloadUrl = file.url_private;
        const response = await fetch(downloadUrl, {
            headers: { 'Authorization': `Bearer ${this.token}` },
        });
        if (!response.ok) {
            throw new Error(`Failed to download Slack file: ${response.status} ${response.statusText}`);
        }
        const content = await response.text();
        return { name: file.name, mimetype: file.mimetype, content };
    }
}
