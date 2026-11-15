import { Suspense } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes, type IRoute } from '@/router/index';
import { Box, Flex, Spinner } from '@chakra-ui/react';

const toRouteObjects = (routeItems: IRoute[]): Parameters<typeof createBrowserRouter>[0] => {
  return routeItems.map(({ name, path, component: Component, handle, children }) => ({
    id: name,
    path,
    element: <Component />,
    handle,
    children: children ? toRouteObjects(children) : undefined,
  }));
};

const router = createBrowserRouter(toRouteObjects(routes), {
  basename: import.meta.env.BASE_URL,
});

const RouteFallback = () => (
  <Flex
    w="100%"
    h="100vh"
    bg={window.location.pathname.startsWith('/shelves') ? '#0a192f' : 'background.bg'}
    color={window.location.pathname.startsWith('/shelves') ? 'white' : undefined}
    justifyContent="center"
    alignItems="center"
  >
    <Spinner size="xl" />
  </Flex>
);

const fallback = <RouteFallback />;

function App() {
  return (
    <Suspense fallback={fallback}>
      <Box minH="100dvh" bg="background.bg">
        <RouterProvider router={router} fallbackElement={fallback} />
      </Box>
    </Suspense>
  );
}

export default App;
