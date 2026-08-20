const KEYWORD_PATTERNS = [
    /Article \d+/gi,
    /Prime Minister|Pradhan Mantri|President|Council of Ministers/gi,
    /Lok Sabha|Rajya Sabha|Cabinet|Constitution/gi,
    /Head of the (State|Government)/gi,
    /Oath of Office|Oath of Secrecy|Floor Test|Hung Parliament/gi,
    /National Emergency|Real Executive|Leader of the Cabinet/gi,
    /Article 74|Article 75|Article 78|Article 352/gi,
];

export const extractKeywords = (text: string, extras: string[] = []): string[] => {
    const found = new Set<string>();

    for (const pattern of KEYWORD_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            for (const match of matches) {
                found.add(match);
            }
        }
    }

    const quoteMatch = text.match(/'([^']+)'|"([^"]+)"/);
    if (quoteMatch) {
        found.add(quoteMatch[1] || quoteMatch[2]);
    }

    for (const extra of extras) {
        if (extra) {
            found.add(extra);
        }
    }

    return Array.from(found);
};
