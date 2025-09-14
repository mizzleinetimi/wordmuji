import { Devvit } from '@devvit/public-api';

Devvit.addCustomPostType({
  name: 'wordmuji',
  description: 'Play WordMuji daily emoji word puzzles',
  render: () => (
    <vstack padding="medium" gap="medium">
      <text size="xxlarge" weight="bold">WordMuji</text>
      <text>Devvit port is under construction. Come back soon!</text>
    </vstack>
  ),
});

export default Devvit;
