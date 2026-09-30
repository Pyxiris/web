/* Copyright 2026 Liam Noonan
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {AttachmentView, PopoutAttachmentView} from "@mail/core/common/attachment_view";
import {
    closeAsideFileViewer,
    filesOf,
    openAsideFileViewer,
    startIndexOf,
} from "@web_responsive/core/file_viewer/file_viewer.esm";
import {onWillUnmount, useEffect} from "@odoo/owl";
import {useBus, useService} from "@web/core/utils/hooks";
import {FileViewer} from "@web/core/file_viewer/file_viewer";
import {patch} from "@web/core/utils/patch";

/**
 * Adapter for mail's usePopoutAttachment (Chatter pager / popout button).
 * User-initiated popout from FileViewer still mounts FileViewer directly.
 */
PopoutAttachmentView.components = {FileViewer};
PopoutAttachmentView.template = "web_responsive.PopoutAttachmentView";
patch(PopoutAttachmentView.prototype, {
    get files() {
        return filesOf(this.state.thread);
    },
    get startIndex() {
        return startIndexOf(this.state.thread, this.files);
    },
});

/**
 * Hollow AttachmentView: opens aside FileViewer for preview forms and gates
 * syncMainAttachment. Popout UX is FileViewer; this only reacts to popout state.
 */
export class FileViewerAttachmentView extends AttachmentView {
    static template = "web_responsive.FileViewerAttachmentView";

    setup() {
        super.setup();
        this.mailPopout = useService("mail.popout");

        const syncViewer = () => {
            if (this.mailPopout.externalWindow || !this.state.thread) {
                closeAsideFileViewer();
                return;
            }
            openAsideFileViewer(this.state.thread);
        };
        useEffect(syncViewer, () => [
            this.props.threadId,
            this.props.threadModel,
            filesOf(this.state.thread)
                .map((file) => file.id)
                .join(","),
            Boolean(this.mailPopout.externalWindow),
        ]);
        useBus(this.uiService.bus, "resize", syncViewer);
        onWillUnmount(closeAsideFileViewer);
    }
}
