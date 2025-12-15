import {_t} from "@web/core/l10n/translation";
import {browser} from "@web/core/browser/browser";
import {cookie} from "@web/core/browser/cookie";
import {registry} from "@web/core/registry";
import {user} from "@web/core/user";

/**
 * @param {import("@web/env").OdooEnv} env
 */
function classicThemeSwitchItem(env) {
    return {
        type: "switch",
        id: "classic_theme.switch",
        description: _t("Classic Theme"),
        callback: () => {
            env.services.classic_theme.switchTheme();
        },
        isChecked: cookie.get("classic_theme") === "classic",
        sequence: 43,
    };
}

export const classicThemeService = {
    dependencies: ["orm", "ui"],

    start(env, {orm, ui}) {
        registry
            .category("user_menuitems")
            .add("classic_theme.switch", classicThemeSwitchItem);

        return {
            async switchTheme() {
                const newValue =
                    cookie.get("classic_theme") === "classic" ? "pure" : "classic";
                cookie.set("classic_theme", newValue);
                await orm.write("res.users", [user.userId], {
                    classic_theme: newValue === "classic",
                });

                ui.block();
                browser.location.reload();
            },
        };
    },
};

registry.category("services").add("classic_theme", classicThemeService);
