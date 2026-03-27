import { Badge, Text } from "@chakra-ui/react";
import { ComponentProps } from "react";

interface IReleaseBadgeProps extends Omit<ComponentProps<typeof Badge>, "children" | "bg" | "color"> {
    release?: string;
    hideRegular?: boolean;
}

const getReleaseBadgeColors = (release?: string) => {
    if (release === "P-Bandai") {
        return {
            bg: "badge.gold.bg",
            color: "badge.gold.fg",
        };
    }

    if (release === "Gundam Base Limited") {
        return {
            bg: "badge.purple.bg",
            color: "badge.purple.fg",
        };
    }

    return {
        bg: "badge.regular.bg",
        color: "badge.regular.fg",
    };
};

const ReleaseBadge: React.FC<IReleaseBadgeProps> = ({ release, hideRegular = false, ...badgeProps }) => {
    const normalizedRelease = release?.trim().toLowerCase();
    const { fontSize, fontWeight } = badgeProps;

    if (normalizedRelease === "regular") {
        if (hideRegular) {
            return null;
        }

        return (
            <Text fontSize={fontSize} fontWeight={fontWeight}>
                {release}
            </Text>
        );
    }

    const badgeColors = getReleaseBadgeColors(release);

    return (
        <Badge
            variant='solid'
            bg={badgeColors.bg}
            color={badgeColors.color}
            opacity={hideRegular ? 1 : 0.7}
            {...badgeProps}
        >
            {release}
        </Badge>
    );
};

export default ReleaseBadge;
