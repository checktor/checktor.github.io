import {Component} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {
  MatCard,
  MatCardActions,
  MatCardAvatar,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle
} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-about-me',
  imports: [
    MatIconButton,
    MatCard,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    MatIcon,
    MatCardAvatar,
    RouterLink
  ],
  templateUrl: './about-me.component.html',
  styleUrl: './about-me.component.scss'
})
export class AboutMeComponent {
}
