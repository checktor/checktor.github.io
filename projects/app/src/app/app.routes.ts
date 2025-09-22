import {Routes} from '@angular/router';
import {AboutMeComponent} from './about-me/about-me.component';
import {OverviewComponent} from './overview/overview.component';
import {BlogPost} from './blog-post/blog-post.component';

export const routes: Routes = [
  {path: '', component: OverviewComponent},
  {path: 'about-me', component: AboutMeComponent},
  {path: 'raspberry-pi-nas-server', component: BlogPost, data: {fileName: 'raspberry-pi-nas-server.md'}}
];
