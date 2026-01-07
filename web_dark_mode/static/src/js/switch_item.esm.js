/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {browser} from "@web/core/browser/browser";
import {cookie} from "@web/core/browser/cookie";
import {registry} from "@web/core/registry";
import {user} from "@web/core/user";

export function darkModeSwitchItem(env) {
    return {
        type: "switch",
        id: "color_scheme.switch",
        description: _t("Dark Mode"),
        callback: () => {
            env.services.color_scheme.switchColorScheme();
        },
        isChecked: cookie.get("color_scheme") === "dark",
        sequence: 40,
    };
}

export const colorSchemeService = {
    dependencies: ["orm", "ui"],

    async start(env, {orm, ui}) {
        const device_preference = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "dark"
            : "light";
        if (cookie.get("dark_mode_device_dependent") === "true") {
            if (cookie.get("color_scheme") !== device_preference) {
                cookie.set("color_scheme", device_preference);
                browser.location.reload();
            }
        } else {
            registry.category("user_menuitems").add("darkmode", darkModeSwitchItem);
        }

        return {
            async switchColorScheme() {
                const scheme = cookie.get("color_scheme") === "dark" ? "light" : "dark";
                cookie.set("color_scheme", scheme);
                await orm.write("res.users", [user.userId], {
                    dark_mode: scheme === "dark",
                });

                ui.block();
                browser.location.reload();
            },
        };
    },
};

registry.category("services").add("color_scheme", colorSchemeService);
