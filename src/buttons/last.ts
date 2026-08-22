import { changePage } from '@/lib/pagination';
import { callback } from '@/lib/buttons';

export default callback('last:', (interaction) =>
  changePage(interaction, (_page, maxPages) => maxPages - 1)
);
