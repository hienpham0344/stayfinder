import 'react-native';

// react-native-web exposes dataSet for CSS/DOM enhancements. Native ignores it.
declare module 'react-native' {
  interface ViewProps {
    dataSet?: Record<string, string | number | boolean | undefined>;
  }
  interface TouchableOpacityProps {
    dataSet?: ViewProps['dataSet'];
  }
}
