import { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { routes } from '@/router/index';
import { Box, Flex, Spinner } from '@chakra-ui/react';

function App() {
  return (
    <Suspense
      fallback={
        <Flex
          w="100%"
          h="100vh"
          bg="background.bg"
          opacity={0.6}
          justifyContent="center"
          alignItems="center"
        >
          <Spinner size="xl"></Spinner>
        </Flex>
      }
    >
      <Box minH="100dvh" bg="background.bg">
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            {routes.map(({ name, path, component: Component, children }, idx) => (
              <Route key={`${name}-${idx}`} path={path} element={<Component />}>
                {children?.map(({ name, path, component: Component, children: childs }, idx) => (
                  <Route key={`${name}-${idx}`} path={path} element={<Component />}>
                    {childs?.map(({ name, path, component: Component }) => (
                      <Route key={name} path={path} element={<Component />} />
                    ))}
                  </Route>
                ))}
              </Route>
            ))}
          </Routes>
        </BrowserRouter>
      </Box>
    </Suspense>
  );
}

export default App;
