import {Component} from '@angular/core';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {HttpClient} from '@angular/common/http';
import {take} from 'rxjs';
import {MatIcon} from '@angular/material/icon';
import {MatFabButton} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {ChatResponse} from './model/chat-response.interface';
import {ChatMessage} from './model/chat-message.interface';
import {MatCard, MatCardContent, MatCardHeader} from '@angular/material/card';

@Component({
  selector: 'app-chat',
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatIcon,
    MatFabButton,
    MatCard,
    MatCardContent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {

  public chatMessages: ChatMessage[] = [
    {"role": "system", "content": "You are a helpful assistant."},
  ];

  public message?: string;

  public chatResponse?: ChatResponse;

  constructor(private httpClient: HttpClient) {
  }

  protected sendMessage(): void {
    this.chatMessages.push(
      {"role": "user", "content": this.message!}
    )

    this.httpClient.post(
      "http://localhost:12434/engines/v1/chat/completions",
      {
        model: "ai/smollm2:1.7b",
        messages: this.chatMessages,
        stream: false
      })
      .pipe(take(1))
      .subscribe((data: any) => {
        this.chatResponse = data;
        this.chatMessages.push(
          this.chatResponse?.choices[0].message!
        )
      });
  }
}
