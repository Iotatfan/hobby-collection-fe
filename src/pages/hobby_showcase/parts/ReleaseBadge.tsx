import { Badge, Text } from "@chakra-ui/react";
import { ComponentProps } from "react";

interface IReleaseBadgeProps extends Omit<ComponentProps<typeof Badge>, "children" | "bg" | "color"> {
    release?: string;
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

const ReleaseBadge: React.FC<IReleaseBadgeProps> = ({ release, ...badgeProps }) => {
    const normalizedRelease = release?.trim().toLowerCase();
    if (normalizedRelease === "regular") {
        return (
            <Text {...badgeProps}>
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
            opacity={0.7}
            {...badgeProps}
        >
            {release}
        </Badge>
    );
};

export default ReleaseBadge;
