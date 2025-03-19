import {Component} from '@angular/core';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-about-me',
  imports: [
    MatCardModule
  ],
  templateUrl: './about-me.component.html',
  styleUrl: './about-me.component.scss'
})
export class AboutMeComponent {
}
