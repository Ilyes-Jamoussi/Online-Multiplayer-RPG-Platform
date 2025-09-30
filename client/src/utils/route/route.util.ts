export const removeLeadingSlash = (route: string): string => {
    return route.startsWith('/') ? route.slice(1) : route;
};
