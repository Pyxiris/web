/* Copyright 2026 Liam Noonan
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {FormRenderer} from "@web/views/form/form_renderer";
import {patch} from "@web/core/utils/patch";

/**
 * Keep SIDE_CHATTER instead of COMBO (AttachmentView beside the form).
 * Leave EXTERNAL_COMBO / EXTERNAL_COMBO_XXL alone so popout still drives layout.
 */
patch(FormRenderer.prototype, {
    mailLayout(hasAttachmentContainer) {
        const layout = super.mailLayout(hasAttachmentContainer);
        return layout === "COMBO" ? "SIDE_CHATTER" : layout;
    },
});
