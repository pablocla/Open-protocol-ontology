import { Redirect } from '@docusaurus/router';

export default function Home(): JSX.Element {
  // Redirect directly to the docs intro page. 
  // We don't want a second Landing Page here since the main Next.js site handles that.
  return <Redirect to="/docs/intro" />;
}
