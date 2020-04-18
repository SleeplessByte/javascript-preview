const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = function override(config, env) {
  // https://github.com/Microsoft/monaco-editor-webpack-plugin#options
  config.plugins.push(
    new MonacoWebpackPlugin({
      languages: ['javascript', 'typescript'], // maybe also coffee
    })
  )

  return config
}
