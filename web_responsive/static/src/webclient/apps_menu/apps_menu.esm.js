/* Copyright 2018 Tecnativa - Jairo Llopis
 * Copyright 2021 ITerra - Sergey Shebanin
 * Copyright 2023 Onestein - Anjeel Haria
 * Copyright 2023 Taras Shabaranskyi
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {useRef} from "@odoo/owl";
import {useBus, useService} from "@web/core/utils/hooks";
import {browser} from "@web/core/browser/browser";
import {NavBar} from "@web/webclient/navbar/navbar";
import {useNavigation} from "@web/core/navigation/navigation";
import {patch} from "@web/core/utils/patch";

patch(NavBar.prototype, {
    setup() {
        super.setup();
        this.command = useService("command");
        this.appsMenuOverlay = useRef("appsMenuOverlay");
        this.appsMenuNavigation = useNavigation(this.appsMenuOverlay, {
            shouldFocusFirstItem: true,
            isNavigationAvailable: () =>
                this.state.isAllAppsMenuOpened && this.ui.activeElement === document,
            hotkeys: {
                /** _closeAppMenuSidebar also sets isAllAppsMenuOpened to false */
                escape: () => this._closeAppMenuSidebar(),
                arrowleft: (navigator) => navigator.previous(),
                arrowright: (navigator) => navigator.next(),
            },
        });
        useBus(this.env.bus, "ACTION_MANAGER:UI-UPDATED", () => {
            this.state.isAllAppsMenuOpened = false;
        });
    },

    onAllAppsBtnClick() {
        this.state.isAppMenuSidebarOpened = false;
        this.state.isAllAppsMenuOpened = true;
    },

    onAppsMenuToggle() {
        this.state.isAppMenuSidebarOpened = false;
        this.state.isAllAppsMenuOpened = !this.state.isAllAppsMenuOpened;
    },

    _openAppMenuSidebar() {
        this.state.isAllAppsMenuOpened = false;
        super._openAppMenuSidebar(...arguments);
    },

    /**
     * Keep an item in focus no matter where the user clicks on the overlay.
     * Clicking on the navbar will stil break focus.
     */
    onAppsMenuOverlayPointerDown(ev) {
        if (ev.target.closest(".o-navigable")) {
            return;
        }
        ev.preventDefault();
        this.appsMenuNavigation.items[0]?.setActive();
    },

    onAppsMenuSearchClick() {
        this._openAppsMenuCommandPalette("/");
    },

    /** Store focused app or search icon before opening command pallete */
    _openAppsMenuCommandPalette(searchValue) {
        const overlay = this.appsMenuOverlay.el;
        const restore = overlay?.contains(document.activeElement)
            ? document.activeElement
            : overlay?.querySelector(".search-icon-button") || null;
        restore?.focus();
        this.command.openMainPalette({searchValue}, () => {
            browser.setTimeout(() => {
                if (this.state.isAllAppsMenuOpened && restore?.isConnected) {
                    restore.focus();
                }
            });
        });
    },

    /** Type-to-search; arrows and Escape come from useNavigation. */
    onAppsMenuKeydown(ev) {
        if (ev.ctrlKey || ev.altKey || ev.metaKey) {
            return;
        }
        if (ev.key.length !== 1 || ev.key === " ") {
            return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        this._openAppsMenuCommandPalette(ev.key === "/" ? "/" : `/${ev.key}`);
    },
});
