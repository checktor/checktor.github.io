import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {BlogPostCard} from '../common/blog-post-card.interface';
import {MatCard, MatCardContent, MatCardHeader, MatCardImage, MatCardTitle} from '@angular/material/card';

@Component({
  selector: 'app-overview',
  imports: [
    RouterLink,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardImage,
    MatCardContent
  ],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent {

  protected blogPostCards: BlogPostCard[] = [
    {
      link: 'raspberry-pi-nas-server',
      title: 'Raspberry Pi NAS server',
      content: 'Searching for security and performance best practices when configuring Samba server on Raspberry Pi.',
      imgSrc: '/imgs/raspberry-pi.jpg',
      imgAlt: 'Raspberry Pi'
    },
    {
      link: 'under-construction',
      title: 'Under construction',
      content: 'Stay tuned!',
      imgSrc: '/imgs/under-construction.jpg',
      imgAlt: 'Under construction'
    }
  ]
}
