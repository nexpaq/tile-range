/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, html, css } from 'lit-element';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings.js';
import { connect } from 'pwa-helpers/connect-mixin.js';
import { store } from '../store.js';
import { 
  navigate, 
  headerBackButtonClicked, 
  initializeModuwareApiAsync, 
  loadLanguageTranslation,
  getPlatform
} from '../actions/app.js';
import { settingsIcon } from './icons.js'
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-scroll-effects/effects/waterfall.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import './icons.js';
import 'webview-tile-header/webview-tile-header'
import '@moduware/morph-pages';
import { registerTranslateConfig, use, translate, get } from "@appnest/lit-translate";
import * as translation from '../translations/language.js';

class MyApp extends connect(store)(LitElement) {

	static get properties() {
		return {
			appTitle: { type: String },
			_page: { type: String },
      _language: { type: String },
      platform: {
        type: String,
        reflect: true
      },
		};
	}

	static get styles() {
		return [
			css`
        :host {
          display: block;
          background-color: #3a3a3a;

          --app-drawer-width: 256px;

          --app-primary-color: #E91E63;
          --app-secondary-color: #293237;
          --app-dark-text-color: var(--app-secondary-color);
          --app-light-text-color: white;
          --app-section-even-color: #f7f7f7;
          --app-section-odd-color: white;

          --app-header-background-color: white;
          --app-header-text-color: var(--app-dark-text-color);
          --app-header-selected-color: var(--app-primary-color);

          --app-drawer-background-color: var(--app-secondary-color);
          --app-drawer-text-color: var(--app-light-text-color);
          --app-drawer-selected-color: #78909C;
        }

        app-header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          text-align: center;
          background-color: var(--app-header-background-color);
          color: var(--app-header-text-color);
          border-bottom: 1px solid #eee;
        }

        .toolbar-top {
          background-color: var(--app-header-background-color);
        }

        [main-title] {
          font-family: 'Pacifico';
          text-transform: lowercase;
          font-size: 30px;
          /* In the narrow layout, the toolbar is offset by the width of the
          drawer button, and the text looks not centered. Add a padding to
          match that button */
          padding-right: 44px;
        }

        .toolbar-list {
          display: none;
        }

        .toolbar-list > a {
          display: inline-block;
          color: var(--app-header-text-color);
          text-decoration: none;
          line-height: 30px;
          padding: 4px 24px;
        }

        .toolbar-list > a[selected] {
          color: var(--app-header-selected-color);
          border-bottom: 4px solid var(--app-header-selected-color);
        }

        .menu-btn {
          background: none;
          border: none;
          fill: var(--app-header-text-color);
          cursor: pointer;
          height: 44px;
          width: 44px;
        }

        .drawer-list {
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          padding: 24px;
          background: var(--app-drawer-background-color);
          position: relative;
        }

        .drawer-list > a {
          display: block;
          text-decoration: none;
          color: var(--app-drawer-text-color);
          line-height: 40px;
          padding: 0 24px;
        }

        .drawer-list > a[selected] {
          color: var(--app-drawer-selected-color);
        }

        /* Workaround for IE11 displaying <main> as inline */
        main,
        morph-pages {
          display: block;
        }

        .main-content {
          padding-top: 64px;
          min-height: 100vh;
        }

        :host .page {
          display: none;
          position: relative;
          height: 100vh;
        }

        :host .page[active] {
          display: block;
        }

        footer {
          padding: 24px;
          background: var(--app-drawer-background-color);
          color: var(--app-drawer-text-color);
          text-align: center;
        }

        /* Wide layout: when the viewport width is bigger than 460px, layout
        changes to a wide layout */
        @media (min-width: 460px) {
          .toolbar-list {
            display: block;
          }

          .menu-btn {
            display: none;
          }

          .main-content {
            padding-top: 107px;
          }

          /* The drawer button isn't shown in the wide layout, so we don't
          need to offset the title */
          [main-title] {
            padding-right: 0px;
          }

        }

        moduware-header {
          --style-background-color: rgb(49, 49, 49);
          --text-color: rgb(216, 216, 216);
          --back-button-color: rgb(216, 216, 216);

          margin-top: 24px;
          /* position: absolute; */
        }

        moduware-header span[slot="right-placeholder"] svg #settingsIcon {
          fill: rgb(216, 216, 216);
        }
      `
		];
	}

	render() {
		return html`
      <!-- Webview Header -->
      <moduware-header	
        @back-button-click="${() => store.dispatch(headerBackButtonClicked())}"
        title="${translate('header.title')}">
        <span slot="right-placeholder" @click="${() => store.dispatch(navigate('/settings-page'))}">${settingsIcon}</span>
			</moduware-header>
      <!-- Main content -->
      <morph-pages role="main" class="main-content">
        <home-page class="page" ?active="${this._page === 'home-page'}"></home-page>
        <settings-page class="page" ?active="${this._page === 'settings-page'}"></settings-page>
        <saved-measurements-page class="page" ?active="${this._page === 'saved-measurements-page'}"></saved-measurements-page>
        <error-page class="page" ?active="${this._page === 'error-page'}"></error-page>
      </morph-pages>
    `;
	}

	constructor() {
		super();
		// To force all event listeners for gestures to be passive.
		// See https://www.polymer-project.org/3.0/docs/devguide/settings#setting-passive-touch-gestures
		setPassiveTouchGestures(true);
	}

	// Load the initial language and mark that the strings has been loaded.
	async connectedCallback() {

		/** this is to register the language translation loader from lit-translate */
		registerTranslateConfig({
			loader: (lang) => Promise.resolve(translation[lang])
		});

		super.connectedCallback();
	}

	firstUpdated() {
		store.dispatch(loadLanguageTranslation());
		store.dispatch(navigate("/home-page"));
    store.dispatch(initializeModuwareApiAsync());
    store.dispatch(getPlatform());
	}

	updated(changedProperties) {
		if (changedProperties.has('_page')) {
		}

		if (changedProperties.has('_language')) {
			use(this._language);
    }
    
    console.log('platform is:', this.platform);
  }
  
  settingsClickHandler() {
    console.log('settings icon clicked!');
  }

	stateChanged(state) {
		this._page = state.app.page;
		this._language = state.app.language;
		this.platform = state.app.platform;
	}
}

window.customElements.define('my-app', MyApp);
