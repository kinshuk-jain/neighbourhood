var path = require('path')

const config = (mode) => ({
  mode,
  optimization: {
    sideEffects: true,
  },
  entry: path.resolve(__dirname, './development/index.ts'),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'index.js',
    publicPath: '/dist/',
  },
  devServer: {
    port: 8000,
    publicPath: '/',
    historyApiFallback: true,
  },
  resolve: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'] },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: '../tsconfig.json',
            },
          },
        ],
      },
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
