import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import scrollSnapPolyfill from 'css-scroll-snap-polyfill'

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

  const gra = function(min, max) {
    return Math.random() * (max - min) + min;
  }
  const init = function(){
    let items = document.querySelectorAll('section');
    for (let i = 0; i < items.length; i++){
      items[i].style.background = 'black';
    }
    scrollSnapPolyfill()
  }
  init();