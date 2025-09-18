import {Component, OnInit} from '@angular/core';
import {Observable, of, switchMap} from 'rxjs';
import {MarkdownComponent} from 'ngx-markdown';
import {ActivatedRoute, Data} from '@angular/router';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-blog-post',
  imports: [
    MarkdownComponent,
    AsyncPipe
  ],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss'
})
export class BlogPost implements OnInit {

  protected markdownFilePath$: Observable<string> | undefined

  constructor(private activatedRoute: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.markdownFilePath$ = this.activatedRoute.data.pipe(
      switchMap((data: Data): Observable<string> => {
        return of(`/posts/${data['fileName'] as string}`)
      })
    )
  }
}
