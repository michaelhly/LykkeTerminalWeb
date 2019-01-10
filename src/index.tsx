import {Provider} from 'mobx-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import './Logger';
import {RootStore} from './stores/index';
import {getWorkerByCurrentBrowser} from './workers/worker';

// tslint:disable-next-line:no-var-requires
const TagManager = require('react-gtm-module');

if (process.env.REACT_APP_ENVIRONMENT === 'production') {
  const tagManagerArgs = {
    gtmId: 'GTM-5ZXBJWR'
  };
  TagManager.initialize(tagManagerArgs);
}

declare global {
  interface Window {
    analytics: any;
  }
}

// tslint:disable-next-line:no-var-requires
const {detect} = require('detect-browser');

const rootStore = new RootStore(true, getWorkerByCurrentBrowser(detect().name));

const render = (AppComponent: any) => {
  ReactDOM.render(
    <Provider {...rootStore}>
      <AppComponent />
    </Provider>,
    document.getElementById('root') as HTMLElement
  );
};

render(App);
