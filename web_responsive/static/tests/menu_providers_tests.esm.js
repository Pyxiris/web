/* global QUnit */
/* Copyright 2023 Taras Shabaranskyi
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {fuzzyLookup} from "@web/core/utils/search";
import {getMenuSearchFields} from "@web_responsive/webclient/menus/menu_search_patch.esm";

QUnit.module("Menu search patch");

QUnit.test("matches submenu breadcrumbs in both directions", (assert) => {
    const menuItems = [
        {
            parents: "Invoicing / Customers",
            label: "Customers",
            fuzzySearchFields: getMenuSearchFields({
                parents: "Invoicing / Customers",
                label: "Customers",
            }),
        },
    ];
    const results = fuzzyLookup("invcuscus", menuItems, () => "");
    assert.strictEqual(results.length, 1);
});
