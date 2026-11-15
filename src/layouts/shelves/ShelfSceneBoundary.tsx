import { resetShelfRoute } from '@/layouts/shelves/routes';
import { Component, type ReactNode } from 'react';
import UnavailableScene from '@/layouts/shelves/UnavailableScene';

export default class ShelfSceneBoundary extends Component<
  { children: ReactNode; path: string },
  { failed: boolean }
> {
  state = { failed: false };
  componentDidCatch() {
    resetShelfRoute(this.props.path);
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <UnavailableScene /> : this.props.children;
  }
}
