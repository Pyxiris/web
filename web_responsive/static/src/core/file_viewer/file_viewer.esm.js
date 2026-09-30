/* Copyright 2021 ITerra - Sergey Shebanin
 * Copyright 2023 Onestein - Anjeel Haria
 * Copyright 2023 Taras Shabaranskyi
 * Copyright 2026 Liam Noonan
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {onMounted, onWillStart, onWillUnmount, useEffect, useRef} from "@odoo/owl";
import {FileViewer} from "@web/core/file_viewer/file_viewer";
import {_t} from "@web/core/l10n/translation";
import {patch} from "@web/core/utils/patch";
import {registry} from "@web/core/registry";
import {useService} from "@web/core/utils/hooks";

const formChatterAsideSelector = ".o-mail-Form-chatter.o-aside";

const ASIDE_FILE_VIEWER_ID = "web_responsive.file_viewer";

/** @param {import("models").Thread|undefined} thread */
export function filesOf(thread) {
    return (thread?.attachmentsInWebClientView || []).filter((file) => file.isViewable);
}

/**
 * @param {import("models").Thread|undefined} thread
 * @param {import("models").Attachment[]} files
 */
export function startIndexOf(thread, files) {
    const main = thread?.message_main_attachment_id;
    if (!main) {
        return 0;
    }
    const index = files.findIndex((file) => file.eq(main));
    return index >= 0 ? index : 0;
}

export function closeAsideFileViewer() {
    registry.category("main_components").remove(ASIDE_FILE_VIEWER_ID);
}

/**
 * Open (or keep) the aside FileViewer for a thread.
 *
 * @param {import("models").Thread} thread
 * @param {{syncMainAttachment?: boolean}} [options]
 */
export function openAsideFileViewer(thread, {syncMainAttachment = true} = {}) {
    const files = filesOf(thread);
    if (!files.length) {
        closeAsideFileViewer();
        return;
    }
    const startIndex = startIndexOf(thread, files);
    const current = registry
        .category("main_components")
        .get(ASIDE_FILE_VIEWER_ID, null);
    if (
        current &&
        current.props.thread === thread &&
        current.props.syncMainAttachment === syncMainAttachment &&
        current.props.files.length === files.length &&
        current.props.files.every((file, index) => file.id === files[index].id)
    ) {
        return;
    }
    closeAsideFileViewer();
    registry.category("main_components").add(ASIDE_FILE_VIEWER_ID, {
        Component: FileViewer,
        props: {
            files,
            startIndex,
            close: closeAsideFileViewer,
            modal: true,
            thread,
            syncMainAttachment,
        },
    });
}

/** Set minimized height from the aside chatter; width comes from FormChatter. */
function useFileViewerAsideHeight(ref) {
    let resizeObserver = null;
    function getAsideChatter() {
        return ref.el?.ownerDocument.querySelector(formChatterAsideSelector);
    }
    function update() {
        const chatter = getAsideChatter();
        if (chatter) {
            ref.el.style.setProperty(
                "--o-FileViewerContainer-height",
                `${chatter.clientHeight}px`
            );
        }
    }
    onMounted(() => {
        const chatter = getAsideChatter();
        if (!chatter) {
            return;
        }
        update();
        resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(chatter);
    });
    onWillUnmount(() => resizeObserver?.disconnect());
}

FileViewer.props = [...FileViewer.props, "thread?", "syncMainAttachment?", "isPopout?"];

patch(FileViewer.prototype, {
    setup() {
        super.setup();
        this.root = useRef("root");
        this.mailPopout = useService("mail.popout");
        this.ui = useService("ui");
        Object.assign(this.state, {
            allowMinimize: false,
            maximized: true,
            isPopout: Boolean(this.props.isPopout),
        });
        useFileViewerAsideHeight(this.root);
        onWillStart(this.setDefaultMaximizeState);
        useEffect(
            () => {
                if (!this.props.syncMainAttachment || !this.props.thread) {
                    return;
                }
                const main = this.props.thread.message_main_attachment_id;
                const index = this.props.files.findIndex(
                    (file) => file.eq?.(main) || file === main
                );
                if (index >= 0 && index !== this.state.index) {
                    this.activateFile(index);
                }
            },
            () => [this.props.thread?.message_main_attachment_id?.id]
        );
    },

    get maximizeLabel() {
        return this.state.maximized ? _t("Minimize") : _t("Maximize");
    },

    setDefaultMaximizeState() {
        if (this.state.isPopout) {
            this.state.allowMinimize = false;
            this.state.maximized = true;
            return;
        }
        this.state.allowMinimize = Boolean(
            document.querySelector(formChatterAsideSelector)
        );
        this.state.maximized = !this.state.allowMinimize;
    },

    toggleMaximized() {
        this.state.maximized = !this.state.maximized;
    },

    /**
     * @override
     */
    next() {
        super.next();
        this.syncMainAttachmentFromIndex();
    },

    /**
     * @override
     */
    previous() {
        super.previous();
        this.syncMainAttachmentFromIndex();
    },

    /** Only when opened from AttachmentView preview (syncMainAttachment + thread). */
    syncMainAttachmentFromIndex() {
        if (!this.props.syncMainAttachment || !this.props.thread) {
            return;
        }
        this.props.thread.setMainAttachmentFromIndex(this.state.index);
    },

    /**
     * Pop out this viewer's files. Owned by FileViewer — not PopoutAttachmentView.
     * Popout first so externalWindow is set before close/resize (aside host listens).
     */
    onClickPopout() {
        if (this.state.isPopout) {
            return;
        }
        this.mailPopout.addHooks(
            () => undefined,
            () => this.ui.bus.trigger("resize")
        );
        this.mailPopout.popout(FileViewer, {
            files: [...this.props.files],
            startIndex: this.state.index,
            close: () => undefined,
            modal: false,
            isPopout: true,
            thread: this.props.thread,
            syncMainAttachment: this.props.syncMainAttachment,
        });
        this.close();
        this.ui.bus.trigger("resize");
    },
});
