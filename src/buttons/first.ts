import { changePage } from '@/lib/pagination';
import { callback } from '@/lib/buttons';

export default callback('first:', (interaction) => changePage(interaction, 0));
