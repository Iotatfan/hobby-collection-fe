export const formatBuiltDateLabel = (value?: string | null): string | null => {
    if (!value) return null;

    const normalizedValue = value.trim();
    if (!normalizedValue || normalizedValue.toLowerCase() === "null") return null;

    const parsedDate = new Date(normalizedValue);
    if (Number.isNaN(parsedDate.getTime())) return null;

    return parsedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};
