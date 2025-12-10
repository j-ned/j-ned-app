import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/components/header/header';

@Component({
  selector: 'app-root',
  imports: [Header, RouterOutlet],
  template: `
    <app-header />
    <router-outlet />
  `,
})
export class App {
}
