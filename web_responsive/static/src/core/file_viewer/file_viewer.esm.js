/* Copyright 2021 ITerra - Sergey Shebanin
 * Copyright 2023 Onestein - Anjeel Haria
 * Copyright 2023 Taras Shabaranskyi
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {onMounted, onWillStart, onWillUnmount, useRef} from "@odoo/owl";
import {FileViewer} from "@web/core/file_viewer/file_viewer";
import {_t} from "@web/core/l10n/translation";
import {patch} from "@web/core/utils/patch";
import {useService} from "@web/core/utils/hooks";

const formChatterAsideSelector = ".o-mail-Form-chatter.o-aside";
const POPOUT_MANAGER_ID = "web_responsive.file_viewer";

FileViewer.props.push("isPopout?");

/** One manager for the file-viewer popout (createManager resets state if called again). */
let fileViewerPopoutManager = null;

function getFileViewerPopoutManager(mailPopoutService) {
    if (!fileViewerPopoutManager) {
        fileViewerPopoutManager = mailPopoutService.createManager(POPOUT_MANAGER_ID);
    }
    return fileViewerPopoutManager;
}

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

    /**
     * Open this viewer in a popup (same files + next/prev) and close the main one.
     */
    popout() {
        const manager = getFileViewerPopoutManager(this.mailPopoutService);
        manager.popout(FileViewer, {
            files: this.props.files,
            startIndex: this.state.index,
            modal: true,
            isPopout: true,
        });
        this.close();
    },
});
