/* Copyright 2018 Tecnativa - Jairo Llopis
 * Copyright 2021 ITerra - Sergey Shebanin
 * Copyright 2023 Onestein - Anjeel Haria
 * Copyright 2023 Taras Shabaranskyi
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

/**
 * Icon props for menu/app rendering (mirrors core menu_helpers + menu_providers).
 *
 * @param {Object} menu
 * @returns {{webIconData?: string, webIcon?: {iconClass: string, color: string, backgroundColor: string}}}
 */
export function getMenuIconProps(menu) {
    if (menu.webIconData) {
        const prefix = menu.webIconData.startsWith("P")
            ? "data:image/svg+xml;base64,"
            : "data:image/png;base64,";
        return {
            webIconData: menu.webIconData.startsWith("data:image")
                ? menu.webIconData
                : prefix + menu.webIconData.replace(/\s/g, ""),
        };
    }
    if (menu.webIcon?.iconClass) {
        return {webIcon: menu.webIcon};
    }
    const [iconClass, color, backgroundColor] = (menu.webIcon || "").split(",");
    if (backgroundColor !== undefined) {
        return {webIcon: {iconClass, color, backgroundColor}};
    }
    return {webIconData: "/web/static/img/default_icon_app.png"};
}
