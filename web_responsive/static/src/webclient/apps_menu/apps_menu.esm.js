/* Copyright 2018 Tecnativa - Jairo Llopis
 * Copyright 2021 ITerra - Sergey Shebanin
 * Copyright 2023 Onestein - Anjeel Haria
 * Copyright 2023 Taras Shabaranskyi
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {useBus, useService} from "@web/core/utils/hooks";
import {NavBar} from "@web/webclient/navbar/navbar";
import {getTabableElements} from "@web/core/utils/ui";
import {patch} from "@web/core/utils/patch";
import {useActiveElement} from "@web/core/ui/ui_service";

patch(NavBar.prototype, {
    setup() {
        super.setup();
        this.command = useService("command");
        useActiveElement("appsMenuOverlay");
        useBus(this.env.bus, "ACTION_MANAGER:UI-UPDATED", () => {
            this.state.isAllAppsMenuOpened = false;
        });
    },

    onAllAppsBtnClick() {
        this._closeAppMenuSidebar();
        this.state.isAllAppsMenuOpened = true;
    },

    onAppsMenuToggle() {
        const willOpen = !this.state.isAllAppsMenuOpened;
        this._closeAppMenuSidebar();
        this.state.isAllAppsMenuOpened = willOpen;
    },

    onAppsMenuSearchClick() {
        this.command.openMainPalette({searchValue: "/"});
    },

    onAppsMenuKeydown(ev) {
        if (ev.key === "Escape") {
            this._closeAppMenuSidebar();
            return;
        }
        if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
            ev.preventDefault();
            this._focusAppsMenuItem(ev.currentTarget, 1);
            return;
        }
        if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
            ev.preventDefault();
            this._focusAppsMenuItem(ev.currentTarget, -1);
            return;
        }
        if (ev.ctrlKey || ev.altKey || ev.metaKey || ev.isComposing) {
            return;
        }
        if (ev.key.length !== 1 || ev.key === " ") {
            return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        this.command.openMainPalette({
            searchValue: ev.key === "/" ? "/" : `/${ev.key}`,
        });
    },

    _focusAppsMenuItem(overlay, delta) {
        const items = getTabableElements(overlay);
        if (!items.length) {
            return;
        }
        const index = items.indexOf(document.activeElement);
        const start = index === -1 ? (delta < 0 ? 0 : -1) : index;
        items[(start + delta + items.length) % items.length].focus();
    },
});
