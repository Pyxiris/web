/* Copyright 2026 Liam Noonan
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {FormRenderer} from "@web/views/form/form_renderer";
import {patch} from "@web/core/utils/patch";

patch(FormRenderer.prototype, {
    mailLayout(hasAttachmentContainer) {
        const layout = super.mailLayout(hasAttachmentContainer);
        return layout === "COMBO" ? "SIDE_CHATTER" : layout;
    },
});
