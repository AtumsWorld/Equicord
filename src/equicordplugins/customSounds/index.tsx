/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { DataStore } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import { Devs, EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Alerts, React } from "@webpack/common";

import { SoundOverrideComponent } from "./components/SoundOverrideComponent";
import { makeEmptyOverride, SoundOverride, soundTypes } from "./types";

const OVERRIDES_KEY = "CustomSounds_overrides";
let overrides: Record<string, SoundOverride> = soundTypes.reduce((result, sound) => ({ ...result, [sound.id]: makeEmptyOverride() }), {});

const settings = definePluginSettings({
    overrides: {
        type: OptionType.COMPONENT,
        description: "",
        component: () =>
            <>
                {soundTypes.map(type =>
                    <SoundOverrideComponent
                        key={type.id}
                        type={type}
                        override={overrides[type.id]}
                        onChange={() => DataStore.set(OVERRIDES_KEY, overrides)}
                    />
                )}
            </>
    }
});

export function isOverriden(id: string): boolean {
    return overrides[id]?.enabled ?? false;
}

export function findOverride(id: string): SoundOverride | null {
    const result = overrides[id];
    if (!result?.enabled)
        return null;

    return result;
}

export default definePlugin({
    name: "CustomSounds",
    description: "Replace Discord's sounds with your own.",
    authors: [Devs.TheKodeToad, EquicordDevs.SpikeHD],
    patches: [
        // sound class
        {
            find: '"_ensureAudioPromise"',
            replacement: [
                // override URL
                {
                    match: /\i\([0-9]+\)\(.{1,20}(\i),"\.mp3"\)/,
                    replace: "$self.findOverride($1)?.url || $&"
                },
                // override volume
                {
                    match: /Math.min\(\i\.\i\.getOutputVolume\(\).{0,20}volume/,
                    replace: "$& * ($self.findOverride(this.name)?.volume ?? 100) / 100"
                }
            ]
        },
        // force classic soundpack for overriden sounds
        {
            find: ".playWithListener().then",
            replacement: {
                match: /\i\.\i\.getSoundpack\(\)/,
                replace: '$self.isOverriden(arguments[0]) ? "classic" : $&'
            }
        }
    ],
    settings,
    findOverride,
    isOverriden,
    afterSave() {
        Alerts.show({
            title: "Restart required",
            body: (
                <>
                    <p>CustomSounds requires a restart for settings to activate.</p>
                </>
            ),
            confirmText: "Restart now",
            cancelText: "Later!",
            onConfirm: () => location.reload()
        });
    },
    async start() {
        overrides = await DataStore.get(OVERRIDES_KEY) ?? {};
        for (const type of soundTypes)
            overrides[type.id] ??= makeEmptyOverride();
    }
});