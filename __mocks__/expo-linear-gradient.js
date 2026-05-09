const React = require('react');
const { View } = require('react-native');

function LinearGradient({ children, ...rest }) {
  return React.createElement(View, rest, children);
}

module.exports = { LinearGradient };
