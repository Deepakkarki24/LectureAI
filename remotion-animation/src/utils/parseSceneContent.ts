export type SceneLayout = "default" | "comparison" | "list" | "quote";

export type Scene = {
    id: string;
    start: number;
    end: number;
    text: string;
    page: number;
    animation: string;
    visualType: string;
    visual: Record<string, unknown>;
};

export type ParsedSceneContent = {
    headline: string;
    lines: string[];
    keywords: string[];
    layout: SceneLayout;
    comparison?: {
        leftTitle: string;
        leftBody: string;
        rightTitle: string;
        rightBody: string;
    };
    quote?: string;
};

const KEYWORD_PATTERNS = [
    /Article \d+/gi,
    /Prime Minister|Pradhan Mantri|President|Council of Ministers/gi,
    /Lok Sabha|Rajya Sabha|Cabinet|Constitution/gi,
    /Head of the (State|Government)/gi,
    /Oath of Office|Oath of Secrecy|Floor Test|Hung Parliament/gi,
    /National Emergency|Real Executive|Leader of the Cabinet/gi,
    /Article 74|Article 75|Article 78|Article 352/gi,
];

const extractKeywords = (text: string, extras: string[] = []): string[] => {
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

const getTitle = (visual: Record<string, unknown>) =>
    typeof visual.title === "string" ? visual.title : "";

const getSubtitle = (visual: Record<string, unknown>) =>
    typeof visual.subtitle === "string" ? visual.subtitle : undefined;

const getStringItems = (visual: Record<string, unknown>) =>
    Array.isArray(visual.items)
        ? visual.items.filter((item): item is string => typeof item === "string")
        : [];

const getFlowSteps = (visual: Record<string, unknown>) =>
    Array.isArray(visual.flow)
        ? visual.flow.filter(
              (step): step is string =>
                  typeof step === "string" && step !== "↓"
          )
        : [];

const getComparisonItems = (visual: Record<string, unknown>) => {
    if (!Array.isArray(visual.items)) {
        return [];
    }

    return visual.items.filter(
        (item): item is { title: string; subtitle: string } =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as { title?: unknown }).title === "string" &&
            typeof (item as { subtitle?: unknown }).subtitle === "string"
    );
};

export const parseSceneContent = (scene: Scene): ParsedSceneContent => {
    const { visualType, visual, text } = scene;
    const title = getTitle(visual);
    const subtitle = getSubtitle(visual);

    switch (visualType) {
        case "comparison": {
            const [left, right] = getComparisonItems(visual);
            const extras = [left?.title, right?.title].filter(Boolean) as string[];

            return {
                headline: title,
                lines: [],
                keywords: extractKeywords(text, extras),
                layout: "comparison",
                comparison: {
                    leftTitle: left?.title ?? "",
                    leftBody: left?.subtitle ?? "",
                    rightTitle: right?.title ?? "",
                    rightBody: right?.subtitle ?? "",
                },
            };
        }

        case "articles": {
            const items = getStringItems(visual);

            return {
                headline: title,
                lines: items,
                keywords: extractKeywords(text, items),
                layout: "list",
            };
        }

        case "article": {
            const items = getStringItems(visual);

            return {
                headline: title,
                lines: items,
                keywords: extractKeywords(text, [title, ...items]),
                layout: "list",
            };
        }

        case "flow":
        case "process": {
            const steps = getFlowSteps(visual);

            return {
                headline: title,
                lines: steps,
                keywords: extractKeywords(text, steps),
                layout: "default",
            };
        }

        case "list": {
            const items = getStringItems(visual);

            return {
                headline: title,
                lines: items,
                keywords: extractKeywords(text, items),
                layout: "list",
            };
        }

        case "timeline": {
            const value =
                typeof visual.value === "string" ? visual.value : undefined;
            const lines = [value, subtitle].filter(Boolean) as string[];

            return {
                headline: title,
                lines,
                keywords: extractKeywords(text, lines),
                layout: "default",
            };
        }

        case "title":
        case "concept":
        case "definition":
        case "question":
        case "emphasis": {
            return {
                headline: title,
                lines: subtitle ? [subtitle] : [],
                keywords: extractKeywords(text, [title, subtitle].filter(Boolean) as string[]),
                layout: "default",
            };
        }

        default: {
            const items = getStringItems(visual);
            const steps = getFlowSteps(visual);
            const lines =
                items.length > 0
                    ? items
                    : steps.length > 0
                      ? steps
                      : subtitle
                        ? [subtitle]
                        : [];

            return {
                headline: title,
                lines,
                keywords: extractKeywords(text, [title, ...lines]),
                layout: items.length > 0 ? "list" : "default",
            };
        }
    }
};
