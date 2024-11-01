/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type MediaType = {
    src: string;
    alt: string;
    isVideo: boolean;
    animated: boolean;
    autoPlay: boolean;
    height?: string;
    width?: string;
};

export type Avatar = {
    avatarSrc: string;
    avatarDecorationSrc: string;
};
