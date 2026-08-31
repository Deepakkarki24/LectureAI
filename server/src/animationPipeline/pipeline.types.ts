export const pageIndexToUrl = (
    pageImageUrls: string[],
    pageNumber1Based: number
): string | undefined => {
    if (pageNumber1Based < 1) {
        return undefined;
    }
    return pageImageUrls[pageNumber1Based - 1];
};
