import {Routes} from '@angular/router';
import {AboutMeComponent} from './about-me/about-me.component';
import {OverviewComponent} from './overview/overview.component';

export const routes: Routes = [
  {path: '', component: OverviewComponent},
  {path: 'about-me', component: AboutMeComponent}
];
