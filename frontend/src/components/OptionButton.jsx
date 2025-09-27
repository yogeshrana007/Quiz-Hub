import { FiCheck, FiX } from "react-icons/fi";

const OptionButton = ({
    option,
    text,
    isSelected,
    onClick,
    result = null,
    disabled = false,
}) => {
    const getButtonStyles = () => {
        let baseStyles =
            "w-full p-4 rounded-lg border text-left transition-all duration-200 flex items-center space-x-3 ";

        if (disabled) {
            baseStyles += "cursor-not-allowed ";
        } else {
            baseStyles += "cursor-pointer hover:shadow-md ";
        }

        // Handle review mode with results
        if (result) {
            switch (result) {
                case "correct":
                    return (
                        baseStyles +
                        "bg-success text-success-foreground border-success animate-pulse-success"
                    );
                case "incorrect":
                    return (
                        baseStyles +
                        "bg-destructive text-destructive-foreground border-destructive animate-pulse-error"
                    );
                case "missed-correct":
                    return (
                        baseStyles +
                        "bg-success/20 text-success border-success border-dashed"
                    );
                default:
                    return (
                        baseStyles +
                        "border-border bg-card text-card-foreground"
                    );
            }
        }

        // Handle normal selection mode
        if (isSelected) {
            return (
                baseStyles +
                "bg-primary text-primary-foreground border-primary shadow-brand bg-green-100"
            );
        }

        return (
            baseStyles +
            "border-border bg-card text-card-foreground hover:bg-muted hover:border-primary/50"
        );
    };

    const getOptionIcon = () => {
        if (
            result === "correct" ||
            (result === "missed-correct" && !isSelected)
        ) {
            return <FiCheck className="h-5 w-5" />;
        }
        if (result === "incorrect") {
            return <FiX className="h-5 w-5" />;
        }
        return null;
    };

    return (
        <button
            onClick={!disabled ? onClick : undefined}
            className={getButtonStyles()}
            disabled={disabled}
        >
            {/* Option letter */}
            <div
                className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
        ${
            isSelected && !result
                ? "bg-primary-foreground text-primary"
                : result
                ? "bg-white/20"
                : "bg-muted text-muted-foreground"
        }
      `}
            >
                {option}
            </div>

            {/* Option text */}
            <span className="flex-1 font-medium">{text}</span>

            {/* Result icon */}
            {getOptionIcon() && (
                <div className="flex-shrink-0">{getOptionIcon()}</div>
            )}
        </button>
    );
};

export default OptionButton;
