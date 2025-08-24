import HobbyShowcaseLayout from '@/layouts/hobby_showcase';
import { Outlet } from 'react-router-dom';

const PublicRouter = () => {

    return (
        <HobbyShowcaseLayout>
            <Outlet />
        </HobbyShowcaseLayout>
    );
};

export default PublicRouter;