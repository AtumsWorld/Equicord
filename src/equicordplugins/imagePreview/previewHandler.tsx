/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { ReactDOM, useEffect, useState } from "@webpack/common";

import { MediaType } from "./types";

let setMediaDataExternal: ((data: MediaType | null) => void) | null = null;
let clearMediaDataExternal: (() => void) | null = null;

let mouseX = 0;
let mouseY = 0;

window.addEventListener("mousemove", (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

const PreviewComponent = () => {
    const [media, setMedia] = useState<MediaType | null>(null);

    setMediaDataExternal = (data: MediaType | null) => setMedia(data);
    clearMediaDataExternal = () => setMedia(null);

    const handleLoaded = () => {
        const loader = document.querySelector(".loader");
        if (loader) loader.remove();
    };

    const handleError = () => {
        const loader = document.querySelector(".loader");
        if (loader) loader.remove();
        const preview = document.querySelector(".image-preview");
        if (preview) preview.innerHTML = "Failed to load media";
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const previewElement = document.querySelector(".image-preview") as HTMLElement;
            if (previewElement) updatePreviewPosition(e, previewElement);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    if (!media) return null;

    const { src, alt, isVideo, animated, autoPlay, height, width } = media;
    const processedUrl = stripDiscordParams(src);

    return (
        <div className="image-preview">
            <div className="loader"></div>

            {isVideo ? (
                <video
                    src={processedUrl}
                    autoPlay={autoPlay}
                    loop={animated}
                    muted
                    playsInline
                    onLoadedData={handleLoaded}
                    onError={handleError}
                    style={{
                        maxHeight: height || "100%",
                        maxWidth: width || "100%",
                    }}
                />
            ) : (
                <img
                    src={processedUrl}
                    alt={alt}
                    onLoad={handleLoaded}
                    onError={handleError}
                    style={{
                        maxHeight: height || "100%",
                        maxWidth: width || "100%",
                    }}
                />
            )}
        </div>
    );
};

function updatePreviewPosition(mouseEvent: MouseEvent, element: HTMLElement) {
    const topPadding = 0;
    const leftPadding = 15;
    const minTopOffset = 30;
    const minBottomOffset = 30;
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.9;

    const mediaElement = element.querySelector("img, video") as HTMLImageElement | HTMLVideoElement | null;
    if (mediaElement) {
        mediaElement.style.maxWidth = `${maxWidth}px`;
        mediaElement.style.maxHeight = `${maxHeight}px`;
    }

    const previewWidth = element.offsetWidth;
    const previewHeight = element.offsetHeight;

    let left = mouseEvent.pageX + leftPadding;
    let top = mouseEvent.pageY + topPadding;

    const spaceOnRight = window.innerWidth - mouseEvent.pageX - previewWidth - leftPadding;
    const spaceOnLeft = mouseEvent.pageX - previewWidth - leftPadding;

    if (spaceOnRight >= leftPadding) {
        left = mouseEvent.pageX + leftPadding;
    } else if (spaceOnLeft >= leftPadding) {
        left = mouseEvent.pageX - previewWidth - leftPadding;
    } else {
        left = Math.max(leftPadding, Math.min(mouseEvent.pageX + leftPadding, window.innerWidth - previewWidth - leftPadding));
    }

    if (top + previewHeight > window.innerHeight - minBottomOffset) {
        top = mouseEvent.pageY - previewHeight;
        if (top < minTopOffset) {
            top = minTopOffset;
        }
    } else {
        top = Math.min(top, window.innerHeight - previewHeight - topPadding - minBottomOffset);
    }

    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
}

export function createPreview(media: MediaType) {
    const processedSrc = media.src.includes("media.tenor.com")
        ? convertTenorUrl(media.src)
        : stripDiscordParams(media.src);

    const isVideo = /\.(mp4|gif|webp)$/.test(processedSrc) || media.isVideo;

    const updatedMedia = {
        ...media,
        src: processedSrc,
        isVideo: isVideo,
        animated: isVideo,
    };

    if (!document.getElementById("preview-container")) {
        const container = document.createElement("div");
        container.id = "preview-container";

        container.style.left = `${mouseX}px`;
        container.style.top = `${mouseY}px`;
        document.body.appendChild(container);
        ReactDOM.render(<PreviewComponent />, container);

        const loader: HTMLElement | null = document.querySelector(".loader");
        if (loader) {
            loader.style.left = `${mouseX}px`;
            loader.style.top = `${mouseY}px`;
        }
    }
    if (setMediaDataExternal) setMediaDataExternal(updatedMedia);
}

export function removePreview() {
    if (clearMediaDataExternal) clearMediaDataExternal();
}

function stripDiscordParams(url: string): string {
    let newUrl = url
        .replace(/([?&])(width|size|height|h|w|format|quality)=[^&]+/g, "")
        .replace(/([?&])+$/, "")
        .replace(/\?&/, "?")
        .replace(/&{2,}/g, "&");

    if (!newUrl.includes("quality=lossless")) {
        newUrl += newUrl.includes("?") ? "&quality=lossless" : "?quality=lossless";
    }

    return newUrl;
}

export function convertTenorUrl(url: string): string {
    const match = url.match(/^https:\/\/images-ext-\d\.discordapp\.net\/external\/[^/]+\/https?\/media\.tenor\.com\/([^/]+)\/([^/]+)/);
    if (!match) return url;

    const id = match[1];
    const name = match[2];

    return `https://media.tenor.com/${id}/${name}`;
}
