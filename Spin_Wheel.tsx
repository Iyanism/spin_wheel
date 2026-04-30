"use client";

import {
    useState,
    useEffect,
    useRef,
    useCallback,
    forwardRef,
    useImperativeHandle,
} from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface SpinWheelProps {
    items: string[];
    onSpin?: (winner: string) => void;
    className?: string;
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    logoSrc?: string;
    wheelType?: "reward" | "finalist" | "entry";
    previousWinner?: string; // Add this prop to track previous winner
}

const DEFAULT_REWARD: number = 899; // Change this to your desired default reward (0 means no default)
const DEFAULT_IDENTIFIER: string = "793155127"; // The unique identifier to match against

// Helper function to check if an item is the default name
const isDefaultName = (item: string): boolean => {
    return item.includes(DEFAULT_IDENTIFIER);
};

// Helper function to find the default name in the items array
const findDefaultNameIndex = (items: string[]): number => {
    return items.findIndex((item) => isDefaultName(item));
};

const SpinWheel = forwardRef<{ spin: () => void }, SpinWheelProps>(
    (
        {
            items,
            onSpin,
            className,
            size = "lg",
            disabled = false,
            logoSrc,
            wheelType = "entry",
            previousWinner, // New prop to track previous winner
        },
        ref
    ) => {
        const [isSpinning, setIsSpinning] = useState(false);
        const [isReady, setIsReady] = useState(true);
        const [rotation, setRotation] = useState(0);
        const [winner, setWinner] = useState<string | null>(null);
        const [lastWinnerIndex, setLastWinnerIndex] = useState<number | null>(null);
        const [hasSelectedDefault, setHasSelectedDefault] = useState(false);
        const wheelRef = useRef<HTMLDivElement>(null);
        const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const animationDuration = 3000; // 3 seconds for spin animation

        const sizeClasses = {
            sm: "w-48 h-48",
            md: "w-[24rem] h-[24rem]",
            lg: "w-[28rem] h-[28rem]",
        };

        const colors = [
            "wheel-slice-1",
            "wheel-slice-2",
            "wheel-slice-3",
            "wheel-slice-3",
            "wheel-slice-4",
            "wheel-slice-5",
            "wheel-slice-6",
            "wheel-slice-7",
            "wheel-slice-8",
        ];

        // Reset hasSelectedDefault when items change or wheel type changes
        useEffect(() => {
            setHasSelectedDefault(false);
        }, [items, wheelType]);

        // Expose spin method via ref
        useImperativeHandle(ref, () => ({
            spin,
        }));

        const spin = useCallback(() => {
            if (!isReady || isSpinning || disabled || items.length === 0) return;

            setIsSpinning(true);
            setIsReady(false);
            setWinner(null);

            const numItems = items.length;
            const segmentAngle = 360 / numItems;

            let selectedWinnerIndex: number;
            const defaultNameIndex = findDefaultNameIndex(items);

            // Check for default selection logic
            if (
                wheelType === "entry" &&
                !hasSelectedDefault &&
                defaultNameIndex !== -1
            ) {
                // Select the default name if it's present and hasn't been selected yet
                selectedWinnerIndex = defaultNameIndex;
                setHasSelectedDefault(true);
            } else if (wheelType === "finalist" && defaultNameIndex !== -1) {
                // Always select the default name for finalist if present
                selectedWinnerIndex = defaultNameIndex;
            } else if (
                wheelType === "reward" &&
                DEFAULT_REWARD !== 0 &&
                items.includes(DEFAULT_REWARD.toString()) &&
                previousWinner &&
                isDefaultName(previousWinner) // Check if previous winner contains the default identifier
            ) {
                // Select the default reward only if the previous winner was the default name
                selectedWinnerIndex = items.indexOf(DEFAULT_REWARD.toString());
            } else {
                // Fallback to original logic
                if (wheelType === "reward") {
                    // Filter to keep only 99, 199, and 299 for selection
                    const allowedRewards = ["99", "199", "299"];
                    const selectableIndexes = items
                        .map((item, index) => ({ item, index }))
                        .filter(({ item }) => allowedRewards.includes(item))
                        .map(({ index }) => index);

                    // If no selectable items (edge case), fallback to all items
                    if (selectableIndexes.length === 0) {
                        selectedWinnerIndex = Math.floor(Math.random() * numItems);
                    } else {
                        // Pure random selection from only allowed rewards (99, 199, 299)
                        const randomSelectableIndex = Math.floor(
                            Math.random() * selectableIndexes.length
                        );
                        selectedWinnerIndex = selectableIndexes[randomSelectableIndex];
                    }
                } else if (wheelType === "entry" && numItems > 1) {
                    // Keep the anti-repetition logic for entries to prevent consecutive same winners
                    const minGap = Math.max(1, Math.floor(numItems / 8));
                    let possibleIndexes: number[] = [];
                    if (lastWinnerIndex === null) {
                        possibleIndexes = Array.from({ length: numItems }, (_, i) => i);
                    } else {
                        for (let i = 0; i < numItems; i++) {
                            const gap = Math.abs(i - lastWinnerIndex);
                            const wrapGap = Math.min(gap, numItems - gap);
                            if (wrapGap >= minGap) {
                                possibleIndexes.push(i);
                            }
                        }
                        if (possibleIndexes.length === 0) {
                            possibleIndexes = Array.from({ length: numItems }, (_, i) => i);
                        }
                    }
                    selectedWinnerIndex =
                        possibleIndexes[Math.floor(Math.random() * possibleIndexes.length)];
                } else {
                    // Default pure random selection
                    selectedWinnerIndex = Math.floor(Math.random() * numItems);
                }
            }

            const sliceCenterAngle =
                selectedWinnerIndex * segmentAngle + segmentAngle / 2;
            let desiredStopAngle = 270 - sliceCenterAngle;
            desiredStopAngle = ((desiredStopAngle % 360) + 360) % 360;

            const minRevolutions = 5;
            const additionalRandomRevolutions = Math.floor(Math.random() * 5);
            const totalRevolutions = minRevolutions + additionalRandomRevolutions;

            const currentNormalizedRotation = rotation % 360;
            let deltaRotation = desiredStopAngle - currentNormalizedRotation;

            if (deltaRotation < 0) {
                deltaRotation += 360;
            }

            const newRotation = rotation + totalRevolutions * 360 + deltaRotation;
            setRotation(newRotation);

            if (spinTimeoutRef.current) {
                clearTimeout(spinTimeoutRef.current);
            }

            spinTimeoutRef.current = setTimeout(() => {
                setIsSpinning(false);
                const winningItem = items[selectedWinnerIndex];
                setWinner(winningItem);
                if (wheelType === "entry") setLastWinnerIndex(selectedWinnerIndex);
                onSpin?.(winningItem);

                setTimeout(
                    () => {
                        setIsReady(true);
                    },
                    wheelType === "entry" ? 1000 : 2000
                );
            }, animationDuration);
        }, [
            isReady,
            isSpinning,
            disabled,
            items,
            rotation,
            onSpin,
            wheelType,
            animationDuration,
            lastWinnerIndex,
            hasSelectedDefault,
            previousWinner, // Add previousWinner to dependencies
        ]);

        // Cleanup on unmount
        useEffect(() => {
            return () => {
                if (spinTimeoutRef.current) {
                    clearTimeout(spinTimeoutRef.current);
                }
            };
        }, []);

        const createWheelSlices = () => {
            if (items.length === 0) return null;

            const segmentAngle = 360 / items.length;
            const radius = 150;

            return (
                <svg className="w-full h-full absolute inset-0" viewBox="0 0 300 300">
                    {items.map((item, index) => {
                        const startAngle = index * segmentAngle;
                        const endAngle = (index + 1) * segmentAngle;

                        const x1 = 150 + radius * Math.cos((startAngle * Math.PI) / 180);
                        const y1 = 150 + radius * Math.sin((startAngle * Math.PI) / 180);
                        const x2 = 150 + radius * Math.cos((endAngle * Math.PI) / 180);
                        const y2 = 150 + radius * Math.sin((endAngle * Math.PI) / 180);

                        const largeArcFlag = segmentAngle > 180 ? 1 : 0;

                        const pathData = [
                            `M 150 150`,
                            `L ${x1} ${y1}`,
                            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                            `Z`,
                        ].join(" ");

                        const textAngleRad =
                            (index * segmentAngle + segmentAngle / 2) * (Math.PI / 180);
                        // Move text closer to inner circle
                        const textRadius = radius * 0.45;
                        const textX = 150 + textRadius * Math.cos(textAngleRad);
                        const textY = 150 + textRadius * Math.sin(textAngleRad);

                        // Position diamond at outer edge
                        const diamondRadius = radius * 0.85;
                        const diamondX = 150 + diamondRadius * Math.cos(textAngleRad);
                        const diamondY = 150 + diamondRadius * Math.sin(textAngleRad);

                        const colorClass = colors[index % colors.length];

                        const colorValues = {
                            "wheel-slice-1": "hsl(262, 83%, 58%)",
                            "wheel-slice-2": "hsl(224, 71%, 60%)",
                            "wheel-slice-3": "hsl(186, 91%, 56%)",
                            "wheel-slice-4": "hsl(142, 76%, 57%)",
                            "wheel-slice-5": "hsl(47, 96%, 56%)",
                            "wheel-slice-6": "hsl(21, 90%, 56%)",
                            "wheel-slice-7": "hsl(340, 82%, 62%)",
                            "wheel-slice-8": "hsl(291, 84%, 61%)",
                        };

                        // Generate dynamic image path based on reward value
                        const getDiamondImage = (rewardValue: string) => {
                            return `/diamonds/${rewardValue}.webp`;
                        };

                        return (
                            <g key={index}>
                                <path
                                    d={pathData}
                                    fill={colorValues[colorClass as keyof typeof colorValues]}
                                    stroke={"white"}
                                    strokeWidth={"2"}
                                />
                                <text
                                    x={textX}
                                    y={textY}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className={`fill-white font-semibold text-xs`}
                                    transform={`rotate(${(textAngleRad * 180) / Math.PI + 180
                                        }, ${textX}, ${textY})`}
                                >
                                    {item.length > 12 ? item.substring(0, 10) + "..." : item}
                                </text>
                                {wheelType === "reward" && (
                                    <image
                                        href={getDiamondImage(item)}
                                        x={diamondX - 20}
                                        y={diamondY - 20}
                                        width="40"
                                        height="40"
                                        style={{ pointerEvents: "none" }}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>
            );
        };

        return (
            <div className={cn("relative flex flex-col items-center", className)}>
                {/* Pointer - fixed at the top */}
                <div className="absolute mt-1 left-1/2 transform -translate-x-1/2 z-20">
                    <div
                        className="w-0 h-0 
    border-l-20 border-r-20 border-t-20 
    border-l-transparent border-r-transparent border-t-white 
    drop-shadow-lg filter drop-shadow-white"
                    ></div>
                </div>

                {/* Wheel Container */}
                <div className="relative">
                    <div
                        ref={wheelRef}
                        className={cn(
                            "relative  rounded-full border-4 border-white overflow-hidden",
                            sizeClasses[size],
                            isSpinning && "pointer-events-none" // Prevent interactions during spin
                        )}
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: isSpinning
                                ? `transform ${animationDuration / 1000
                                }s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                                : "none",
                        }}
                    >
                        {items.length > 0 ? (
                            createWheelSlices()
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                                <span className="text-sm">No items</span>
                            </div>
                        )}
                    </div>
                    {/* Stationary Center Circle / Logo - Moved outside the rotating wheelRef */}
                    {logoSrc ? (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full overflow-hidden z-10 flex items-center justify-center">
                            <Image
                                src={logoSrc}
                                width={100}
                                height={100}
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-15 h-15 bg-white rounded-full shadow-md border-2 border-gray-200 z-10 flex items-center justify-center">
                            {/* This div remains if no logoSrc is provided, providing the default white circle */}
                        </div>
                    )}
                </div>

                {/* Manual Spin Button - For finalist and reward wheels */}
                {(wheelType === "finalist" || wheelType === "reward") &&
                    isReady &&
                    !isSpinning &&
                    !winner && (
                        <button
                            onClick={spin}
                            disabled={!isReady || isSpinning || !!winner || disabled} // 👈 Add disabled check here
                            className={cn(
                                "mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold shadow-soft transition-all duration-200",
                                "hover:bg-primary/90 hover:shadow-medium active:scale-95",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                            )}
                        >
                            Spin Wheel
                        </button>
                    )}

                {wheelType === "entry" && (
                    <span className="absolute bottom-4 left-38">
                        <Image
                            src={"/spin_overlay.png"}
                            alt="spin_overlay.png"
                            width={200}
                            height={200}
                        />
                    </span>
                )}
                {/* Manual Spin Button */}
                {wheelType === "entry" && (
                    <div className="relative">
                        <button
                            onClick={spin}
                            disabled={
                                !isReady || isSpinning || disabled || items.length === 0
                            }
                            className={cn(
                                "mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold shadow-soft transition-all duration-200",
                                "hover:bg-primary/90 hover:shadow-medium active:scale-95",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                            )}
                        >
                            Spin Wheel
                        </button>
                    </div>
                )}

                {/* Winner Display - Only show when not spinning and winner exists */}
                {winner && !isSpinning && wheelType != "entry" && (
                    <div className=" mt-2 w-40 h-20 flex-col flex justify-center items-center bg-white rounded-lg shadow-medium border animate-bounce-in">
                        <p className="text-sm font-medium text-muted-foreground">
                            {wheelType === "reward" ? "Reward:" : "Selected Member:"}
                        </p>
                        <p className="text-lg text-center font-semibold text-primary">
                            {wheelType === "reward" ? `₹${winner}` : winner}
                        </p>
                    </div>
                )}
            </div>
        );
    }
);
SpinWheel.displayName = "SpinWheel";
export { SpinWheel };