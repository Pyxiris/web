/* Copyright 2018 Tecnativa - Jairo Llopis
 * Copyright 2021 ITerra - Sergey Shebanin
 * Copyright 2023 Onestein - Anjeel Haria
 * Copyright 2023 Taras Shabaranskyi
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {Component} from "@odoo/owl";

export class AppMenuItem extends Component {
    /**
     * Same icon resolution as core `computeAppsAndMenuItems` for apps.
     */
    get iconProps() {
        const menu = this.props.app;
        if (menu.webIconData) {
            return {webIconData: menu.webIconData};
        }
        const [iconClass, color, backgroundColor] = (menu.webIcon || "").split(",");
        if (backgroundColor !== undefined) {
            return {webIcon: {iconClass, color, backgroundColor}};
        }
        return {webIconData: "/web/static/img/default_icon_app.png"};
    }

    get isActive() {
        const {currentApp} = this.props;
        return currentApp && currentApp.id === this.props.app.id;
    }

    get className() {
        const classItems = ["o-app-menu-item"];
        if (this.isActive) {
            classItems.push("active");
        }
        return classItems.join(" ");
    }

    onClick() {
        if (typeof this.props.onClick === "function") {
            this.props.onClick(this.props.app);
        }
    }
}

Object.assign(AppMenuItem, {
    template: "web_responsive.AppMenuItem",
    props: {
        app: Object,
        href: String,
        currentApp: {
            type: Object,
            optional: true,
        },
        onClick: Function,
    },
});
