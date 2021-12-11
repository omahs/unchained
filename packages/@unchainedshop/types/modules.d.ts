import { AccountsModule } from './accounts';
import { UsersModule } from './user';
import { BookmarksModule } from './bookmarks';
import { CountriesModule } from './countries';
import { CurrenciesModule } from './currencies';
import { EventsModule } from './events';
import { FilesModule } from './files';
import { LanguagesModule } from './languages';
import { PaymentModule } from './payments';
import { WarehousingModule } from './warehousing';
import { WorkerModule } from './worker';

export interface Modules {
  accounts: AccountsModule;
  assortments: any;
  bookmarks: BookmarksModule;
  countries: CountriesModule;
  currencies: CurrenciesModule;
  delivery: any;
  documents: any;
  enrollments: any;
  events: EventsModule;
  files: FilesModule;
  filters: any;
  languages: LanguagesModule;
  messaging: any;
  orders: any;
  payment: PaymentModule;
  products: any;
  quotations: any;
  users: UsersModule;
  warehousing: WarehousingModule;
  worker: WorkerModule;
}
