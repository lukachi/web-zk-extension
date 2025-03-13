import {
    motion,
    MotionValue,
    useMotionValue,
    useSpring,
    useTransform,
    type SpringOptions,
    AnimatePresence,
} from "motion/react";
import React, {
    Children,
    cloneElement,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export type DockItemData = {
    icon: React.ReactNode;
    label: React.ReactNode;
    onClick: () => void;
    className?: string;
};

export type DockProps = {
    items: DockItemData[];
    className?: string;
    distance?: number;
    panelHeight?: number;
    baseItemSize?: number;
    dockHeight?: number;
    magnification?: number;
    spring?: SpringOptions;
};

type DockItemProps = {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    mouseX: MotionValue;
    spring: SpringOptions;
    distance: number;
    baseItemSize: number;
    magnification: number;
};

function DockItem({
                      children,
                      className = "",
                      onClick,
                      mouseX,
                      spring,
                      distance,
                      magnification,
                      baseItemSize,
                  }: DockItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isHovered = useMotionValue(0);

    const mouseDistance = useTransform(mouseX, (val) => {
        const rect = ref.current?.getBoundingClientRect() ?? {
            x: 0,
            width: baseItemSize,
        };
        return val - rect.x - baseItemSize / 2;
    });

    const targetSize = useTransform(
        mouseDistance,
        [-distance, 0, distance],
        [baseItemSize, magnification, baseItemSize]
    );
    const size = useSpring(targetSize, spring);

    return (
        <motion.div
            ref={ref}
            style={{
                width: size,
                height: size,
            }}
            onHoverStart={() => isHovered.set(1)}
            onHoverEnd={() => isHovered.set(0)}
            onFocus={() => isHovered.set(1)}
            onBlur={() => isHovered.set(0)}
            onClick={onClick}
            className={`relative inline-flex items-center justify-center bg-[#060606] border shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] cursor-pointer rounded-[10px] border-solid border-[#222] ${className}`}
            tabIndex={0}
            role="button"
            aria-haspopup="true"
        >
            {Children.map(children, (child) =>
                cloneElement(child as React.ReactElement, { isHovered })
            )}
        </motion.div>
    );
}

type DockLabelProps = {
    className?: string;
    children: React.ReactNode;
};

function DockLabel({ children, className = "", ...rest }: DockLabelProps) {
    const { isHovered } = rest as { isHovered: MotionValue<number> };
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = isHovered.on("change", (latest) => {
            setIsVisible(latest === 1);
        });
        return () => unsubscribe();
    }, [isHovered]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -10 }}
                    exit={{ opacity: 0, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute top-[-1.5rem] w-fit whitespace-pre border bg-[#060606] text-xs text-white -translate-x-2/4 px-2 py-0.5 rounded-md border-solid border-[#222] left-2/4 ${className}`}
                    role="tooltip"
                    style={{ x: "-50%" }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

type DockIconProps = {
    className?: string;
    children: React.ReactNode;
};

function DockIcon({ children, className = "" }: DockIconProps) {
    return <div className={`flex items-center justify-center ${className}`}>{children}</div>;
}

export default function UiDock({
                                 items,
                                 className = "",
                                 spring = { mass: 0.1, stiffness: 150, damping: 12 },
                                 magnification = 70,
                                 distance = 200,
                                 panelHeight = 68,
                                 dockHeight = 256,
                                 baseItemSize = 50,
                             }: DockProps) {
    const mouseX = useMotionValue(Infinity);
    const isHovered = useMotionValue(0);

    const maxHeight = useMemo(
        () => Math.max(dockHeight, magnification + magnification / 2 + 4),
        [magnification, dockHeight]
    );
    const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
    const height = useSpring(heightRow, spring);

    return (
        <motion.div
            style={{ height, scrollbarWidth: "none" }}
            className="flex max-w-full items-center mx-2 my-0"
        >
            <motion.div
                onMouseMove={({ pageX }) => {
                    isHovered.set(1);
                    mouseX.set(pageX);
                }}
                onMouseLeave={() => {
                    isHovered.set(0);
                    mouseX.set(Infinity);
                }}
                className={`absolute -translate-x-2/4 flex items-end w-fit gap-4 bg-[#060606] border pt-0 pb-2 px-2 rounded-2xl border-solid border-[#222] left-2/4 bottom-2 ${className}`}
                style={{ height: panelHeight }}
                role="toolbar"
                aria-label="Application dock"
            >
                {items.map((item, index) => (
                    <DockItem
                        key={index}
                        onClick={item.onClick}
                        className={item.className}
                        mouseX={mouseX}
                        spring={spring}
                        distance={distance}
                        magnification={magnification}
                        baseItemSize={baseItemSize}
                    >
                        <DockIcon>{item.icon}</DockIcon>
                        <DockLabel>{item.label}</DockLabel>
                    </DockItem>
                ))}
            </motion.div>
        </motion.div>
    );
}
