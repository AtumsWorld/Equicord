/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { EquicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";

import { createPreview, removePreview } from "./previewHandler";

export default definePlugin({
    name: "ImagePreview",
    description: "Hover on message images, avatars, links, and message stickers to show a full preview.",
    authors: [EquicordDevs.creations],
    patches: [
        {
            find: "getFormatQuality(){",
            replacement: [
                {
                    match: /N\(\i,"onMouseEnter",\i=>\{/,
                    replace: "$&$self.handleHover(this);"
                },
                {
                    match: /N\(\i,"onMouseLeave",\i=>\{/,
                    replace: "$&$self.removePreview();"
                }
            ],
        },
        {
            find: "B.udG.SOCIAL_LAYER_INTEGRATION",
            replacement: {
                match: /onMouseEnter:(\i),onMouseLeave:(\i),src:(\i),"aria-hidden":!\d/,
                replace: "onMouseEnter:(() => { $self.handleAvatarHover(e); $1(); }), onMouseLeave:(() => { $self.removePreview(); $2(); }), src:$3,\"aria-hidden\":!0"
            }
        }
    ],
    start() {
    },
    stop() {
    },

    handleAvatarHover(avatar: any) {
        if (!avatar.avatarSrc || !avatar?.avatarDecorationSrc) return;
        const isAnimated = avatar.avatarDecorationSrc.includes(".gif");

        console.log(avatar, isAnimated);

        createPreview({ src: avatar.avatarSrc, alt: "Avatar", isVideo: isAnimated, animated: isAnimated, autoPlay: isAnimated });
    },

    handleHover(media: any) {
        let { height, width, src } = media.props;
        const { zoomThumbnailPlaceholder, alt, animated, autoPlay, item, original, dataSafeSrc } = media.props;
        if (zoomThumbnailPlaceholder) return;

        const isVideo = item?.type === "VIDEO";

        if (isVideo) {
            src = item?.originalItem?.url || src;
            height = item?.originalItem?.height || height;
            width = item?.originalItem?.width || width;
        } else {
            src = dataSafeSrc || original || src;
        }

        createPreview({ src, alt, isVideo, animated, autoPlay, height, width });
    },

    removePreview
});
