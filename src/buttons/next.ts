import { changePage } from '@/lib/pagination';
import { callback } from '@/lib/buttons';

export default callback('next:', (interaction) =>
  changePage(interaction, (page) => page + 1)
);
