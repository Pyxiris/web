/* Copyright 2026 Liam Noonan
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {Chatter} from "@mail/chatter/web_portal/chatter";
import {patch} from "@web/core/utils/patch";
import {useEffect} from "@odoo/owl";
import {useFileViewer} from "@web/core/file_viewer/file_viewer_hook";
import {useService} from "@web/core/utils/hooks";

patch(Chatter.prototype, {
    setup() {
        super.setup(...arguments);
        this.fileViewer = useFileViewer();
        this.mailPopoutService = useService("mail.popout");

        useEffect(
            this.attachmentPreviewEffect.bind(this),
            this.attachmentPreviewDependencies.bind(this)
        );
    },

    attachmentPreviewEffect() {
        const files = this.state.thread?.attachmentsInWebClientView;

        // While an external popout is open, layout is EXTERNAL_COMBO*;
        // do not also show the in-page minimized FileViewer.
        if (
            this.mailPopoutService.externalWindow ||
            !(
                this.props.hasAttachmentPreview &&
                this.props.isChatterAside &&
                files?.length
            )
        ) {
            this.fileViewer.close();
            return;
        }

        const main = files.includes(this.state.thread.message_main_attachment_id)
            ? this.state.thread.message_main_attachment_id
            : files[0];
        this.fileViewer.open(main, files);
    },

    /**
     * @returns {Array}
     */
    attachmentPreviewDependencies() {
        return [
            this.props.isChatterAside,
            this.state.thread?.localId,
            Boolean(this.state.thread?.attachmentsInWebClientView.length),
            Boolean(this.mailPopoutService.externalWindow),
        ];
    },
});
