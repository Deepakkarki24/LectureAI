type HighlightedTextProps = {
    text: string;
    keywords: string[];
    highlightOpacity?: number;
};

export const HighlightedText = ({
    text,
    keywords,
    highlightOpacity = 1,
}: HighlightedTextProps) => {
    if (keywords.length === 0) {
        return <>{text}</>;
    }

    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(
        `(${sortedKeywords.map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
        "gi"
    );

    const parts = text.split(pattern);

    return (
        <>
            {parts.map((part, index) => {
                const isKeyword = sortedKeywords.some(
                    (kw) => kw.toLowerCase() === part.toLowerCase()
                );

                if (!isKeyword) {
                    return <span key={index}>{part}</span>;
                }

                return (
                    <span
                        key={index}
                        style={{
                            color: "#fbbf24",
                            fontWeight: 700,
                            backgroundColor: `rgba(251, 191, 36, ${0.15 * highlightOpacity})`,
                            padding: "2px 6px",
                            borderRadius: 4,
                        }}
                    >
                        {part}
                    </span>
                );
            })}
        </>
    );
};
