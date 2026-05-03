try {
  require.resolve('babel-preset-expo');
  console.log('babel-preset-expo OK');
} catch (e) { console.log('babel-preset-expo FAIL'); }

try {
  require.resolve('nativewind/babel');
  console.log('nativewind/babel OK');
} catch (e) { console.log('nativewind/babel FAIL'); }

try {
  require.resolve('react-native-worklets-core/plugin');
  console.log('react-native-worklets-core/plugin OK');
} catch (e) { console.log('react-native-worklets-core/plugin FAIL'); }

try {
  require.resolve('react-native-reanimated/plugin');
  console.log('react-native-reanimated/plugin OK');
} catch (e) { console.log('react-native-reanimated/plugin FAIL'); }
