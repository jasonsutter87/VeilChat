/**
 * TibbyTalk - Entry Point
 * @format
 */

// IMPORTANT: Crypto polyfill must be imported first
import './src/config/crypto';

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
