import { registerRootComponent } from 'expo';
import { Platform, AppRegistry } from 'react-native';
import App from './App';

if (Platform.OS === 'web') {
  // For web, manually render to DOM
  const rootTag = document.getElementById('root');
  if (rootTag) {
    AppRegistry.registerComponent('main', () => App);
    AppRegistry.runApplication('main', { rootTag });
  }
} else {
  registerRootComponent(App);
}
