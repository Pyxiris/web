/* License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {patch} from "@web/core/utils/patch";
import * as menuHelpers from "@web/webclient/menus/menu_helpers";
import * as searchUtils from "@web/core/utils/search";

export function getMenuSearchFields(item) {
    const breadcrumb = item.parents ? `${item.parents} / ${item.label}` : item.label;
    return [breadcrumb, breadcrumb.split("/").reverse().join("/")];
}

patch(menuHelpers, {
    computeAppsAndMenuItems(menuTree) {
        const result = super.computeAppsAndMenuItems(menuTree);
        for (const item of result.menuItems) {
            item.fuzzySearchFields = getMenuSearchFields(item);
        }
        return result;
    },
});

patch(searchUtils, {
    fuzzyLookup(pattern, list, fn) {
        return super.fuzzyLookup(pattern, list, (item) => {
            if (item.fuzzySearchFields) {
                return item.fuzzySearchFields;
            }
            return fn(item);
        });
    },
});
