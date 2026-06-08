import HobbyShowcaseLayout from '@/layouts/hobby_showcase';
import { Outlet, useMatches } from 'react-router-dom';

type RouteHandle = {
  showHeader?: boolean;
};

const PublicRouter = () => {
  const matches = useMatches();
  const showHeader = matches.some((match) => (match.handle as RouteHandle | undefined)?.showHeader);

  return (
    <HobbyShowcaseLayout showHeader={showHeader}>
      <Outlet />
    </HobbyShowcaseLayout>
  );
};

export default PublicRouter;
