import { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { routes, type IRoute } from '@/router/index';
import { Box, Flex, Spinner } from '@chakra-ui/react';

const renderRoutes = (routeItems: IRoute[]) => {
  return routeItems.map(({ name, path, component: Component, children }) => (
    <Route key={`${name}-${path}`} path={path} element={<Component />}>
      {children ? renderRoutes(children) : null}
    </Route>
  ));
};

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
          <Spinner size="xl" />
        </Flex>
      }
    >
      <Box minH="100dvh" bg="background.bg">
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>{renderRoutes(routes)}</Routes>
        </BrowserRouter>
      </Box>
    </Suspense>
  );
}

export default App;
