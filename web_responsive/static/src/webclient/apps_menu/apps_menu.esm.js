/* Copyright 2018 Tecnativa - Jairo Llopis
 * Copyright 2021 ITerra - Sergey Shebanin
 * Copyright 2023 Onestein - Anjeel Haria
 * Copyright 2023 Taras Shabaranskyi
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {Component} from "@odoo/owl";
import {router} from "@web/core/browser/router";
import {registry} from "@web/core/registry";
import {useHotkey} from "@web/core/hotkeys/hotkey_hook";
import {useActiveElement} from "@web/core/ui/ui_service";
import {useBus, useService} from "@web/core/utils/hooks";
import {getTabableElements} from "@web/core/utils/ui";
import {patch} from "@web/core/utils/patch";
import {standardActionServiceProps} from "@web/webclient/actions/action_service";
import {NavBar} from "@web/webclient/navbar/navbar";
import {WebClient} from "@web/webclient/webclient";

const APPS_MENU_ACTION_TAG = "web_responsive.apps_menu";

/** Client action descriptor (no DB record; same style as core client_actions). */
const APPS_MENU_ACTION = {
    type: "ir.actions.client",
    tag: APPS_MENU_ACTION_TAG,
    target: "current",
};

function isAppsMenuAction(action) {
    return action?.tag === APPS_MENU_ACTION_TAG;
}

function canCloseAppsMenu(breadcrumbs) {
    return breadcrumbs?.length > 1;
}

function hasControllerBehindAppsMenu(controller) {
    if (!controller || !isAppsMenuAction(controller.action)) {
        return false;
    }
    return canCloseAppsMenu(controller.config.breadcrumbs);
}

function isRouterOnAppsMenu(state = router.current) {
    return state.actionStack?.at(-1)?.action === "menu";
}

/**
 * Browser navigation left the apps menu while it is still the active controller:
 * restore the stacked controller instead of reloading from the URL (preserves action context).
 */
function shouldRestoreFromAppsMenuRouteChange(controller) {
    return hasControllerBehindAppsMenu(controller) && !isRouterOnAppsMenu();
}

export class AppsMenuAction extends Component {
    static template = "web_responsive.AppsMenu";
    static props = {...standardActionServiceProps};
    /** Router path for bare `/odoo` (see core `router.stateToUrl`). */
    static path = "menu";

    setup() {
        this.menuService = useService("menu");
        this.command = useService("command");
        useActiveElement("appsMenuRoot");
        useHotkey("escape", () => this.closeAppsMenu());
        useHotkey("alt+h", () => this.closeAppsMenu());
    }

    get apps() {
        return this.menuService.getApps();
    }

    get currentApp() {
        return this.menuService.getCurrentApp();
    }

    getMenuItemHref(app) {
        return `/odoo/${app.actionPath || "action-" + app.actionID}`;
    }

    closeAppsMenu() {
        if (canCloseAppsMenu(this.env.config.breadcrumbs)) {
            this.env.config.historyBack();
        }
    }

    onAppClick(app) {
        this.menuService.selectMenu(app);
    }

    onAppsMenuSearchClick() {
        this.command.openMainPalette({searchValue: "/"});
    }

    onAppsMenuKeydown(ev) {
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
    }

    _focusAppsMenuItem(root, delta) {
        const items = getTabableElements(root);
        if (!items.length) {
            return;
        }
        const index = items.indexOf(document.activeElement);
        const start = index === -1 ? (delta < 0 ? 0 : -1) : index;
        items[(start + delta + items.length) % items.length].focus();
    }
}

registry.category("actions").add(APPS_MENU_ACTION_TAG, AppsMenuAction);

// Push a history entry when opening the apps menu so browser back does not replace the
// underlying action's history state (see action_service.pushState which always replaces).
const pushState = router.pushState;
router.pushState = (state, options = {}) => {
    if (state.actionStack?.at(-1)?.action === "menu") {
        options = {...options, replace: false};
    }
    return pushState(state, options);
};

patch(NavBar.prototype, {
    setup() {
        super.setup();
        this.actionService = useService("action");
        useBus(this.env.bus, "ACTION_MANAGER:UPDATE", () => this.render());
        useBus(this.env.bus, "ACTION_MANAGER:UI-UPDATED", () => this.render());
    },

    get isAppsMenuOpen() {
        return isAppsMenuAction(this.actionService.currentController?.action);
    },

    get showAppsMenuButton() {
        return (
            !this.isAppsMenuOpen ||
            hasControllerBehindAppsMenu(this.actionService.currentController)
        );
    },

    openAppsMenu() {
        this._closeAppMenuSidebar();
        if (this.isAppsMenuOpen) {
            return this.closeAppsMenu();
        }
        return this.actionService.doAction(APPS_MENU_ACTION);
    },

    closeAppsMenu() {
        const controller = this.actionService.currentController;
        if (!hasControllerBehindAppsMenu(controller)) {
            return;
        }
        controller.config.historyBack();
    },

    onAllAppsBtnClick() {
        this.openAppsMenu();
    },
});

patch(WebClient.prototype, {
    async loadRouterState() {
        const controller = this.actionService.currentController;
        if (shouldRestoreFromAppsMenuRouteChange(controller)) {
            await this.actionService.restore();
            return;
        }
        return super.loadRouterState(...arguments);
    },

    _loadDefaultApp() {
        if (this.env.services.pwa?.isScopedApp) {
            return super._loadDefaultApp(...arguments);
        }
        return this.actionService.doAction(APPS_MENU_ACTION, {
            clearBreadcrumbs: true,
        });
    },
});
