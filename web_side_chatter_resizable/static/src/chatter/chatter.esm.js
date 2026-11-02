/* Copyright 2026 Liam Noonan
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl). */

import "@web_side_chatter_resizable/core/resizable_panel.esm";
import {Chatter} from "@mail/chatter/web_portal/chatter";
import {ResizablePanel} from "@web/core/resizable_panel/resizable_panel";
import {browser} from "@web/core/browser/browser";
import {patch} from "@web/core/utils/patch";

const MIN_WIDTH_PROPERTY = "--SideChatter-minWidth";

function getChatterMinWidth() {
    const minWidth = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(MIN_WIDTH_PROPERTY),
        10
    );
    return Number.isFinite(minWidth) && minWidth > 0 ? minWidth : 400;
}

// Mail.Chatter stays the inner body. The template renders ResizablePanel
// only when props.isChatterAside is true.
Object.assign(Chatter.components, {ResizablePanel});
Chatter.template = "web_side_chatter_resizable.Chatter";

patch(Chatter.prototype, {
    setup() {
        super.setup(...arguments);
        this.chatterMinWidth = getChatterMinWidth();
    },

    get chatterWidthStorageKey() {
        const viewType = this.env.config?.viewType || "default";
        return `web_side_chatter_resizable.width.${viewType}`;
    },

    get chatterWidth() {
        const stored = parseInt(
            browser.localStorage.getItem(this.chatterWidthStorageKey),
            10
        );
        if (!Number.isFinite(stored) || stored <= 0) {
            return this.chatterMinWidth;
        }
        return Math.max(this.chatterMinWidth, stored);
    },

    onChatterResize(width) {
        browser.localStorage.setItem(
            this.chatterWidthStorageKey,
            String(Math.round(width))
        );
    },
});
