import { Migration } from '@mikro-orm/migrations'

export class Migration20231105084644 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      "create table `charge-tasks` (`id` integer not null primary key autoincrement, `mode` text check (`mode` in ('charge', 'discharge', 'optimize', 'disabled')) not null, `from` datetime not null, `till` datetime not null, `power` real not null, `target` real null, `hold_off` real null, unique (`id`));",
    )
    this.addSql(
      'create table `index` (`id` integer not null primary key autoincrement, `name` text not null, unique (`id`));',
    )
    this.addSql(
      'create table `index-values` (`start_time` timestamp not null, `index_id` int not null, `hr_time` varchar not null, `end_time` timestamp not null, `price` real not null, constraint `index-values_index_id_foreign` foreign key(`index_id`) references `index`(`id`) on update cascade, primary key (`start_time`, `index_id`));',
    )
    this.addSql('create index `index-values_index_id_index` on `index-values` (`index_id`);')
    this.addSql(
      'create table `quarterly` (`start_time` timestamp not null, `hr_time` varchar not null, `grid_consumed` real not null, `grid_produced` real not null, `monthly_peak` real not null, `battery_soc` real not null, primary key (`start_time`));',
    )
  }
}
