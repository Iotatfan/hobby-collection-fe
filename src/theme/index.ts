import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const customConfig = defineConfig({
    theme: {
        tokens: {
            colors: {
                gold: { value: "#EAB308" },
                purple: { value: "#7C3AED" },
                regular: { value: "#374151" },
                blueTint: { value: "#F5F7FA" },
                specificationLabel: { value: "#9CA3AF" },
                specificationValue: { value: "#F3F4F6" }
            },
        },
        semanticTokens: {
            colors: {
                badge: {
                    gold: {
                        bg: { value: "{colors.gold}" },
                        fg: { value: "{colors.black}" },
                    },
                    purple: {
                        bg: { value: "{colors.purple}" },
                        fg: { value: "{colors.white}" },
                    },
                    regular: {
                        bg: { value: "{colors.regular}" },
                        fg: { value: "{colors.white}" },
                    },
                },
                background: {
                    bg: { value: "{colors.blueTint}" }
                },
                scrollbar: {
                    track: { value: "rgba(26, 32, 44, 0.85)" },
                    thumb: { value: "rgba(113, 128, 150, 0.75)" },
                    thumbHover: { value: "rgba(160, 174, 192, 0.9)" },
                },
            },
        },
    },
    globalCss: {
        ".custom-scrollbar": {
            scrollbarWidth: "thin",
            scrollbarColor: "{colors.scrollbar.thumb} {colors.scrollbar.track}",
            "&::-webkit-scrollbar": {
                width: "8px",
                height: "8px",
            },
            "&::-webkit-scrollbar-track": {
                background: "{colors.scrollbar.track}",
                borderRadius: "999px",
            },
            "&::-webkit-scrollbar-thumb": {
                background: "{colors.scrollbar.thumb}",
                borderRadius: "999px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
                background: "{colors.scrollbar.thumbHover}",
            },
        },
    },
});

export const system = createSystem(defaultConfig, customConfig);
