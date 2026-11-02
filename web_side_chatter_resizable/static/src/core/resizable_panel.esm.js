/* eslint-disable */
/**
 * Copy of useResizable in
 * https://github.com/odoo/odoo/blob/19.0/addons/web/static/src/core/resizable_panel/resizable_panel.js
 * The only difference is pointer events instead of mouse events
 */

import {
    onMounted,
    onWillUnmount,
    onWillUpdateProps,
    useComponent,
    useEffect,
    useExternalListener,
    useRef,
} from "@odoo/owl";
import {ResizablePanel} from "@web/core/resizable_panel/resizable_panel";
import {patch} from "@web/core/utils/patch";

function useResizable({
    containerRef,
    handleRef,
    initialWidth = 400,
    getMinWidth = () => 400,
    onResize = () => {},
    getResizeSide = () => "end",
}) {
    // prettier-ignore
    containerRef = typeof containerRef == "string" ? useRef(containerRef) : containerRef;
    handleRef = typeof handleRef == "string" ? useRef(handleRef) : handleRef;
    const props = useComponent().props;

    let minWidth = getMinWidth(props);
    let resizeSide = getResizeSide(props);
    let isChangingSize = false;

    useExternalListener(document, "pointerup", () => onPointerUp());
    useExternalListener(document, "pointercancel", () => onPointerUp());
    useExternalListener(document, "pointermove", (ev) => onPointerMove(ev));

    useExternalListener(window, "resize", () => {
        const limit = getLimitWidth();
        if (getContainerRect().width >= limit) {
            resize(computeFinalWidth(limit));
        }
    });

    let docDirection;
    useEffect(
        (container) => {
            if (container) {
                docDirection = getComputedStyle(container).direction;
            }
        },
        () => [containerRef.el]
    );

    onMounted(() => {
        if (handleRef.el) {
            resize(initialWidth);
            handleRef.el.addEventListener("pointerdown", onPointerDown);
            handleRef.el.addEventListener("click", onClick);
        }
    });

    onWillUpdateProps((nextProps) => {
        minWidth = getMinWidth(nextProps);
        resizeSide = getResizeSide(nextProps);
    });

    onWillUnmount(() => {
        if (handleRef.el) {
            handleRef.el.removeEventListener("pointerdown", onPointerDown);
            handleRef.el.removeEventListener("click", onClick);
        }
    });

    function onClick(ev) {
        ev.preventDefault();
    }

    function onPointerDown(ev) {
        isChangingSize = true;
        document.body.classList.add("pe-none", "user-select-none");
        try {
            ev.currentTarget.setPointerCapture(ev.pointerId);
        } catch {
            // No active pointer.
        }
    }

    function onPointerUp() {
        isChangingSize = false;
        document.body.classList.remove("pe-none", "user-select-none");
    }

    function onPointerMove(ev) {
        if (!isChangingSize || !containerRef.el) {
            return;
        }
        const direction =
            (docDirection === "ltr" && resizeSide === "end") ||
            (docDirection === "rtl" && resizeSide === "start")
                ? 1
                : -1;
        const fixedSide = direction === 1 ? "left" : "right";
        const containerRect = getContainerRect();
        const newWidth = (ev.clientX - containerRect[fixedSide]) * direction;
        resize(computeFinalWidth(newWidth));
    }

    function computeFinalWidth(targetContainerWidth) {
        const handlerSpacing = handleRef.el ? handleRef.el.offsetWidth / 2 : 10;
        const w = Math.max(minWidth, targetContainerWidth + handlerSpacing);
        const limit = getLimitWidth();
        return Math.min(w, limit - handlerSpacing);
    }

    function getContainerRect() {
        const container = containerRef.el;
        const offsetParent = container.offsetParent;
        let containerRect = {};
        if (!offsetParent) {
            containerRect = container.getBoundingClientRect();
        } else {
            containerRect.left = container.offsetLeft;
            containerRect.right = container.offsetLeft + container.offsetWidth;
            containerRect.width = container.offsetWidth;
        }
        return containerRect;
    }

    function getLimitWidth() {
        const offsetParent = containerRef.el.offsetParent;
        return offsetParent ? offsetParent.offsetWidth : window.innerWidth;
    }

    function resize(width) {
        containerRef.el.style.setProperty("width", `${width}px`);
        onResize(width);
    }
}

patch(ResizablePanel.prototype, {
    setup() {
        useResizable({
            containerRef: "containerRef",
            handleRef: "handleRef",
            onResize: this.props.onResize,
            initialWidth: this.props.initialWidth,
            getMinWidth: (props) => props.minWidth,
            getResizeSide: (props) => props.handleSide,
        });
    },
});
