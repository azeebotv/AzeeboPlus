const React = require('react');

function createMockComponent(name, testID = name) {
  const Component = React.forwardRef(({ children, style, testID: tid, accessibilityLabel, accessible, accessibilityRole, onPress, onClick, ...props }, ref) => {
    return React.createElement(
      'div',
      {
        ref,
        'data-testid': tid || testID,
        'aria-label': accessibilityLabel,
        role: accessibilityRole,
        style,
        onClick: onClick || onPress,
        ...props,
      },
      children,
    );
  });
  Component.displayName = name;
  return Component;
}

const View = createMockComponent('View');
const Text = createMockComponent('Text');
const TouchableOpacity = createMockComponent('TouchableOpacity');
const ActivityIndicator = createMockComponent('ActivityIndicator');
const ScrollView = createMockComponent('ScrollView');
const TextInput = createMockComponent('TextInput');
const Image = createMockComponent('Image');
const Pressable = createMockComponent('Pressable');
const FlatList = createMockComponent('FlatList');
const Modal = createMockComponent('Modal');
const SafeAreaView = createMockComponent('SafeAreaView');
const KeyboardAvoidingView = createMockComponent('KeyboardAvoidingView');

const StyleSheet = {
  create(styles) {
    return styles;
  },
  flatten(style) {
    return style;
  },
  compose(a, b) {
    return [a, b];
  },
  absoluteFill: {},
  absoluteFillObject: {},
  hairlineWidth: 1,
};

const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
  Version: 1,
};

const AccessibilityInfo = {
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  fetch: jest.fn(() => Promise.resolve({ reduceMotionEnabled: false, screenReaderEnabled: false })),
  isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
  isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
  setAccessibilityFocus: jest.fn(),
  announceForAccessibility: jest.fn(),
};

const Dimensions = {
  get: jest.fn(() => ({ width: 375, height: 812, scale: 3, fontScale: 1 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const Linking = {
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const Alert = {
  alert: jest.fn(),
};

const Animated = {
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  })),
  timing: jest.fn(() => ({ start: jest.fn((cb) => cb && cb()) })),
  spring: jest.fn(() => ({ start: jest.fn((cb) => cb && cb()) })),
  parallel: jest.fn(() => ({ start: jest.fn((cb) => cb && cb()) })),
  sequence: jest.fn(() => ({ start: jest.fn((cb) => cb && cb()) })),
  View: createMockComponent('AnimatedView'),
  Text: createMockComponent('AnimatedText'),
  Image: createMockComponent('AnimatedImage'),
};

module.exports = {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
  Pressable,
  FlatList,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  AccessibilityInfo,
  Dimensions,
  Linking,
  Alert,
  Animated,
  StatusBar: createMockComponent('StatusBar'),
  Switch: createMockComponent('Switch'),
  GestureHandlerRootView: createMockComponent('GestureHandlerRootView'),
  Keyboard: {
    dismiss: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeListener: jest.fn(),
  },
  PixelRatio: {
    get: jest.fn(() => 3),
    getFontScale: jest.fn(() => 1),
    getPixelSizeForLayoutSize: jest.fn((s) => s * 3),
    roundToNearestPixel: jest.fn((s) => s),
  },
  useColorScheme: jest.fn(() => 'light'),
  useWindowDimensions: jest.fn(() => ({ width: 375, height: 812, scale: 3, fontScale: 1 })),
};
