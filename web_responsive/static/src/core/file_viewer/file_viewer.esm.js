/* Copyright 2021 ITerra - Sergey Shebanin
 * Copyright 2023 Onestein - Anjeel Haria
 * Copyright 2023 Taras Shabaranskyi
 * Copyright 2026 Liam Noonan
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {
    onMounted,
    onWillStart,
    onWillUnmount,
    onWillUpdateProps,
    useRef,
} from "@odoo/owl";
import {FileViewer} from "@web/core/file_viewer/file_viewer";
import {PopoutAttachmentView} from "@mail/core/common/attachment_view";
import {_t} from "@web/core/l10n/translation";
import {patch} from "@web/core/utils/patch";
import {useService} from "@web/core/utils/hooks";

const formChatterAsideSelector = ".o-mail-Form-chatter.o-aside";

FileViewer.props.push("isPopout?");

/** Set minimized height from the aside chatter; width comes from FormChatter. */
function useFileViewerAsideHeight(ref) {
    let resizeObserver = null;
    function update() {
        const chatter = ref.el?.ownerDocument.querySelector(formChatterAsideSelector);
        if (chatter && ref.el) {
            ref.el.style.setProperty(
                "--o-FileViewerContainer-height",
                `${chatter.clientHeight}px`
            );
        }
    }
    onMounted(() => {
        const chatter = ref.el?.ownerDocument.querySelector(formChatterAsideSelector);
        if (!chatter) {
            return;
        }
        update();
        resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(chatter);
    });
    onWillUnmount(() => resizeObserver?.disconnect());
}

/**
 * Keep AbstractAttachmentView's thread wiring; only swap the rendered viewer.
 * usePopoutAttachment already mounts this class with threadId / threadModel.
 */
PopoutAttachmentView.components = {...PopoutAttachmentView.components, FileViewer};

patch(PopoutAttachmentView.prototype, {
    get files() {
        return this.state.thread?.attachmentsInWebClientView ?? [];
    },

    get startIndex() {
        const {files} = this;
        if (!files.length) {
            return 0;
        }
        const main = files.includes(this.state.thread.message_main_attachment_id)
            ? this.state.thread.message_main_attachment_id
            : files[0];
        return files.indexOf(main);
    },
});

patch(FileViewer.prototype, {
    setup() {
        super.setup();
        this.root = useRef("root");
        this.mailPopoutService = useService("mail.popout");
        Object.assign(this.state, {
            allowMinimize: false,
            maximized: true,
        });
        useFileViewerAsideHeight(this.root);
        onWillStart(this.setDefaultMaximizeState);
        // Pager re-open keeps the same useFileViewer registry key, so Owl only
        // updates props. Core FileViewer reads files/startIndex in setup — sync.
        onWillUpdateProps((nextProps) => this.onFileViewerPropsUpdate(nextProps));
    },

    onFileViewerPropsUpdate(nextProps) {
        const nextFile = nextProps.files[nextProps.startIndex];
        if (
            nextFile === this.state.file &&
            nextProps.startIndex === this.state.index &&
            nextProps.files === this.props.files
        ) {
            return;
        }
        this.state.index = nextProps.startIndex;
        this.state.file = nextFile;
        this.state.imageLoaded = false;
        this.state.isIframeLoaded = false;
        this.state.scale = 1;
        this.state.angle = 0;
    },

    get maximizeLabel() {
        return this.state.maximized ? _t("Minimize") : _t("Maximize");
    },

    setDefaultMaximizeState() {
        this.state.allowMinimize =
            !this.props.isPopout &&
            Boolean(document.querySelector(formChatterAsideSelector));
        this.state.maximized = !this.state.allowMinimize;
    },

    toggleMaximized() {
        this.state.maximized = !this.state.maximized;
    },

    next() {
        super.next();
        this.syncMainAttachment();
    },

    previous() {
        super.previous();
        this.syncMainAttachment();
    },

    /**
     * When the current file belongs to a thread's web-client attachment list,
     * persist message_main_attachment_id (AttachmentView next/prev behavior).
     */
    syncMainAttachment() {
        const thread = this.state.file?.thread;
        if (!thread?.setMainAttachmentFromIndex) {
            return;
        }
        const index = thread.attachmentsInWebClientView.findIndex(
            (attachment) =>
                attachment.eq?.(this.state.file) || attachment.id === this.state.file.id
        );
        if (index >= 0) {
            thread.setMainAttachmentFromIndex(index);
        }
    },

    popout() {
        const triggerLayout = () => this.ui.bus.trigger("resize");
        this.mailPopoutService.addHooks(triggerLayout, triggerLayout);
        const thread = this.state.file?.thread;
        if (thread) {
            this.mailPopoutService.popout(PopoutAttachmentView, {
                threadId: thread.id,
                threadModel: thread.model,
            });
        } else {
            this.mailPopoutService.popout(FileViewer, {
                files: this.props.files,
                startIndex: this.state.index,
                modal: true,
                isPopout: true,
            });
        }
        this.close();
    },
});
