/* Copyright 2026 Liam Noonan
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {Chatter} from "@mail/chatter/web_portal/chatter";
import {patch} from "@web/core/utils/patch";
import {useEffect} from "@odoo/owl";
import {useFileViewer} from "@web/core/file_viewer/file_viewer_hook";
import {useService} from "@web/core/utils/hooks";

/**
 * Auto-open minimized FileViewer when the form opts into attachment preview
 * (same gate as the chatter restore button). Popout stays on core restore;
 * PopoutAttachmentView template renders FileViewer.
 */
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

    attachmentPreviewDependencies() {
        const files = this.state.thread?.attachmentsInWebClientView;
        return [
            this.props.isChatterAside,
            this.props.threadId,
            this.props.threadModel,
            this.state.thread?.message_main_attachment_id?.id,
            // Id list so async attachment fetch after pager also re-opens.
            files?.map((attachment) => attachment.id).join(",") ?? "",
            Boolean(this.mailPopoutService.externalWindow),
        ];
    },
});
