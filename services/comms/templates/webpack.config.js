var path = require('path')

const config = (mode) => ({
  mode,
  optimization: {
    sideEffects: true,
  },
  entry: path.resolve(__dirname, 'index.ts'),
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js',
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'public'),
  },
  module: {
    resolve: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'] },
    rules: [
      { test: /\.tsx?$/, exclude: /node_modules/, use: ['ts-loader'] },
      {
        test: /(\.css)$/,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devtool: mode === 'development' ? 'source-map' : false,
})

module.exports = (env, argv) => config(argv.mode)
