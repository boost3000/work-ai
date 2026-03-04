export interface SlackConfig {
    token: string;
}

export interface SlackChannel {
    id: string;
    name: string;
    is_channel: boolean;
    is_group: boolean;
    is_im: boolean;
    is_mpim: boolean;
    is_member: boolean;
    num_members?: number;
    topic?: { value: string };
    purpose?: { value: string };
}

export interface SlackUserProfile {
    display_name: string;
    real_name: string;
    email?: string;
    image_48?: string;
}

export interface SlackUser {
    id: string;
    name: string;
    real_name: string;
    deleted: boolean;
    is_bot: boolean;
    profile: SlackUserProfile;
}

export interface SlackMessage {
    type: string;
    user?: string;
    text: string;
    ts: string;
    thread_ts?: string;
}

interface SlackResponseMetadata {
    next_cursor?: string;
}

export interface SlackApiResponse {
    ok: boolean;
    error?: string;
    response_metadata?: SlackResponseMetadata;
}

export interface SlackChannelsResponse extends SlackApiResponse {
    channels: SlackChannel[];
}

export interface SlackUsersResponse extends SlackApiResponse {
    members: SlackUser[];
}

export interface SlackMessagesResponse extends SlackApiResponse {
    messages: SlackMessage[];
    has_more: boolean;
}

export interface SlackPostMessageResponse extends SlackApiResponse {
    channel: string;
    ts: string;
    message: SlackMessage;
}

export interface SlackOpenDMResponse extends SlackApiResponse {
    channel: { id: string };
}
