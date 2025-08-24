import type React from "react";
import { Box } from '@chakra-ui/react';


interface IHobbyShowcaseLayout {
    children: React.ReactNode;
}

const HobbyShowcaseLayout: React.FC<IHobbyShowcaseLayout> = ({ children }) => {


    return (
       <Box>Hobby Showcase Layout {children}</Box>
    )
}

export default HobbyShowcaseLayout