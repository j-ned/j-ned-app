import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { App } from './app/app';
import { serverConfig } from './app/app.config.server';

const bootstrap = (context: BootstrapContext): Promise<unknown> =>
  bootstrapApplication(App, serverConfig, context);

export default bootstrap;
