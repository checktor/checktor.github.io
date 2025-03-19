import {Component} from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'app-root',
  imports: [
    MatToolbar,
    MatIcon,
    RouterOutlet,
    RouterLink,
    MatIconButton
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}
