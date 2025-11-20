import { Component, signal } from '@angular/core';
import { Header } from './components/header/header';
import { Home } from './pages/home/home';

@Component({
  selector: 'app-root',
  imports: [Header, Home],
  template: `
    <app-header />
    <app-home />
  `,
})
export class App {
  protected readonly title = signal('angular-portfolio-app');
}
