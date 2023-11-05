import { Migration } from '@mikro-orm/migrations'

export class Migration20231105090803 extends Migration {
  async up(): Promise<void> {
    this.addSql('ALTER TABLE quarterly ADD house_consumed REAL DEFAULT (null);')
    this.addSql('ALTER TABLE quarterly ADD solar_produced REAL DEFAULT (null);')
    this.addSql('ALTER TABLE quarterly ADD battery_charged REAL DEFAULT (null);')
    this.addSql('ALTER TABLE quarterly ADD battery_discharged REAL DEFAULT (null);')
  }
}
