/* global document */

/* Copyright 2018 Tecnativa - Jairo Llopis
 * Copyright 2021 ITerra - Sergey Shebanin
 * Copyright 2023 Onestein - Anjeel Haria
 * Copyright 2023 Taras Shabaranskyi
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {Component, useRef, useState} from "@odoo/owl";
import {useAutofocus, useBus, useService} from "@web/core/utils/hooks";
import {AppMenuItem} from "@web_responsive/components/apps_menu_item/apps_menu_item.esm";
import {NavBar} from "@web/webclient/navbar/navbar";
import {WebClient} from "@web/webclient/webclient";
import {patch} from "@web/core/utils/patch";
import {useHotkey} from "@web/core/hotkeys/hotkey_hook";
import {BurgerMenu} from "@web/webclient/burger_menu/burger_menu";

patch(WebClient.prototype, {
    setup() {
        super.setup();
        useBus(this.env.bus, "APPS_MENU:STATE_CHANGED", ({detail: state}) => {
            document.body.classList.toggle("o_apps_menu_opened", state);
        });
    },
});

export class AppsMenu extends Component {
    setup() {
        super.setup();
        this.state = useState({open: false});
        this.command = useService("command");
        this.menuRef = useRef("menu");
        this.searchBarInput = useAutofocus({refName: "SearchBarInput", mobile: true});
        useBus(this.env.bus, "ACTION_MANAGER:UI-UPDATED", () => {
            this.setOpenState(false);
        });
        this._setupKeyNavigation();
    }

    get searchInputValue() {
        const {el} = this.searchBarInput;
        return el ? el.value : "";
    }

    set searchInputValue(value) {
        const {el} = this.searchBarInput;
        if (el) {
            el.value = value;
        }
    }

    onSearchInput() {
        if (this.searchInputValue) {
            this._openSearchMenu(this.searchInputValue);
            this.searchInputValue = "";
        }
    }

    onSearchKeydown(ev) {
        if (this.searchInputValue) {
            return;
        }
        const apps = this.menuRef.el?.querySelectorAll(".o-app-menu-item");
        if (!apps?.length) {
            return;
        }
        if (ev.key === "ArrowDown" || ev.key === "ArrowRight") {
            ev.preventDefault();
            apps[0].focus();
        } else if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") {
            ev.preventDefault();
            apps[apps.length - 1].focus();
        }
    }

    onSearchClick() {
        this._openSearchMenu();
    }

    _openSearchMenu(value) {
        const searchValue = value ? `/${value}` : "/";
        this.command.openMainPalette({searchValue}, null);
    }

    setOpenState(open_state) {
        this.state.open = open_state;
        this.env.bus.trigger("APPS_MENU:STATE_CHANGED", open_state);
    }

    /**
     * Setup navigation among app menus
     */
    _setupKeyNavigation() {
        const repeatable = {
            allowRepeat: true,
        };
        useHotkey(
            "ArrowRight",
            () => {
                this._onWindowKeydown("next");
            },
            repeatable
        );
        useHotkey(
            "ArrowLeft",
            () => {
                this._onWindowKeydown("prev");
            },
            repeatable
        );
        useHotkey(
            "ArrowDown",
            () => {
                this._onWindowKeydown("next");
            },
            repeatable
        );
        useHotkey(
            "ArrowUp",
            () => {
                this._onWindowKeydown("prev");
            },
            repeatable
        );
        useHotkey("Escape", () => {
            this.env.bus.trigger("ACTION_MANAGER:UI-UPDATED");
        });
    }

    _onWindowKeydown(direction) {
        const apps = [...(this.menuRef.el?.querySelectorAll(".o-app-menu-item") ?? [])];
        if (!apps.length) {
            return;
        }
        const index = apps.indexOf(document.activeElement);
        if (direction === "prev") {
            if (index <= 0) {
                this.searchBarInput.el?.focus();
                return;
            }
            apps[index - 1].focus();
            return;
        }
        if (index === -1) {
            return;
        }
        apps[index < apps.length - 1 ? index + 1 : 0].focus();
    }

    onMenuClick() {
        this.setOpenState(!this.state.open);
    }
}

// Add this patch after the WebClient patch
patch(NavBar.prototype, {
    setup() {
        super.setup();

        useBus(this.env.bus, "APP_MENU:TOGGLE_SIDEBAR", () => {
            this._openAppMenuSidebar();
        });
    },
});

Object.assign(AppsMenu, {
    template: "web_responsive.AppsMenu",
    props: {},
});

Object.assign(NavBar.components, {
    AppsMenu,
    AppMenuItem,
});

// Add this patch after the WebClient patch
patch(BurgerMenu.prototype, {
    _openAppMenuSidebarMobile() {
        this.env.bus.trigger("APP_MENU:TOGGLE_SIDEBAR");
    },
});
