import {Component, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {BlogPostCard} from '../common/blog-post-card.interface';
import {MatCard, MatCardContent, MatCardHeader, MatCardImage, MatCardTitle} from '@angular/material/card';
import {HttpClient} from '@angular/common/http';
import {take} from 'rxjs';

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
export class OverviewComponent implements OnInit {

  constructor(private httpClient: HttpClient) {
  }

  ngOnInit(): void {
    this.httpClient.post(
      "http://smollm:12434/engines/v1/chat/completions",
      {
        model: "ai/smollm2:1.7b",
        messages: [{"role": "user", "content": "Explain containerization in one line."}],
        stream: false
      },
      {
        headers: {
          Origin: "http://localhost:4200"
        }
      })
      .pipe(take(1))
      .subscribe((data) => {
        console.log(data)
      });
  }

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
