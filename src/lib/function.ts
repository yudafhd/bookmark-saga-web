
export const filterByQuery = <T extends {
    title?: string;
    url?: string;
    domain?: string;
    tags?: string[];
}>(
    list: T[],
    query?: string
): T[] => {
    if (!list.length || !query) return list;

    const q = query.toLowerCase();

    return list.filter((item) => {
        const textParts: string[] = [
            item.title ?? "",
            item.url ?? "",
            item.domain ?? "",
            ...(item.tags ?? []),
        ];

        const haystack = textParts.join(" ").toLowerCase();
        return haystack.includes(q);
    });
};