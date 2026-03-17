import { Button, Drawer, Portal, Text, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

type DrawerOption = {
    key: string | number;
    label: ReactNode;
    isSelected: boolean;
    onSelect: () => void;
};

type FormSelectDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    options: DrawerOption[];
    emptyText?: string;
};

const FormSelectDrawer = ({ open, onOpenChange, title, options, emptyText }: FormSelectDrawerProps) => {
    return (
        <Drawer.Root open={open} onOpenChange={(event) => onOpenChange(event.open)}>
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header>
                            <Drawer.Title>{title}</Drawer.Title>
                        </Drawer.Header>
                        <Drawer.Body>
                            <VStack align="stretch" gap={2}>
                                {options.map((option) => (
                                    <Button
                                        type="button"
                                        key={option.key}
                                        variant={option.isSelected ? "solid" : "outline"}
                                        colorPalette={option.isSelected ? "blue" : "gray"}
                                        justifyContent="space-between"
                                        onClick={option.onSelect}
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                                {options.length === 0 && (
                                    <Text color="fg.muted">{emptyText ?? "No options available."}</Text>
                                )}
                            </VStack>
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
};

export default FormSelectDrawer;

