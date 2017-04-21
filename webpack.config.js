let path = require('path');
let webpack = require('webpack');

/**
 * Plugins
 */
let CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
let autoprefixer = require('autoprefixer');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let ExtractTextPlugin = require('extract-text-webpack-plugin');
let CopyWebpackPlugin = require('copy-webpack-plugin');

/**
 * ENV
 */
let ENV = process.env.npm_lifecycle_event;
let isTestWatch = ENV === 'test-watch';
let isTest = ENV === 'test' || isTestWatch;
let isProd = ENV === 'build';


module.exports = function makeWebpackConfig() {
  let config = {};

  if (isProd) {
    config.devtool = 'source-map';
  } else if (isTest) {
    config.devtool = 'inline-source-map';
  } else {
    config.devtool = 'eval-source-map';
  }

  if (!isTest) {
    /**
     * Entry
     * This are the entrypoint for the angular app
     * Reference: http://webpack.github.io/docs/configuration.html#entry
     */
    config.entry = {
      'polyfills': './src/polyfills.ts',
      'vendor': './src/vendor.ts',
      'app': './src/main.ts'  // main app
    };
  }

  /**
   * Output
   * These are the parameters to render our bundle
   * Reference: http://webpack.github.io/docs/configuration.html#output
   */
  config.output = isTest ? {} : {
    path: root('dist'),
    publicPath: isProd ? '/' : 'http://localhost:8080/',
    filename: isProd ? 'js/[name].[hash].js' : 'js/[name].js',
    chunkFilename: isProd ? '[id].[hash].chunk.js' : '[id].chunk.js'
  };

  /**
   * Resolve
   * This ensure that webpack only checks for those file types.
   * Reference: http://webpack.github.io/docs/configuration.html#resolve
   */
  config.resolve = {
    extensions: ['.ts', '.js', '.css', '.scss', '.html', '.jade', '.pug', '.json']
  };

  /**
   * options for awesome-typescript-loader
   * @type {string}
   */
  let atlOptions = '';
  if (isTest && !isTestWatch) {
    // awesome-typescript-loader needs to output inlineSourceMap for code coverage to work with source maps.
    atlOptions = 'inlineSourceMap=true&sourceMap=false';
  }

  /**
   * Loaders
   * Reference: http://webpack.github.io/docs/configuration.html#module-loaders
   * List: http://webpack.github.io/docs/list-of-loaders.html
   * This handles most of the magic responsible for converting modules
   */
  config.module = {
    rules: [
      {
        /**
         * https://github.com/s-panferov/awesome-typescript-loader
         * https://github.com/TheLarkInn/angular2-template-loader
         */
        test: /\.ts$/,
        use: ['awesome-typescript-loader?' + atlOptions, 'angular2-template-loader'],
        exclude: [isTest ? /\.(e2e)\.ts$/ : /\.(spec|e2e)\.ts$/, /node_modules\/(?!(ng2-.+))/]
      },
      {
        /** Support for CSS as raw text
         * https://github.com/webpack-contrib/css-loader
         * https://github.com/postcss/postcss-loader
         * use 'null' loader in test mode (https://github.com/webpack/null-loader)
         * all css in src/style will be bundled in an external css file
         * https://github.com/webpack-contrib/extract-text-webpack-plugin
         */
        test: /\.css$/,
        exclude: root('src', 'app'),
        use: isTest ? 'null-loader' : ExtractTextPlugin.extract(
          {
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader']
          }
        )
      },
      {
        /**
         * loader for css inside sources
         */
        test: /\.css$/,
        include: root('src', 'app'),
        use: ['raw-loader', 'postcss-loader']
      },
      {
        /**
         * https://github.com/webpack-contrib/css-loader
         * https://github.com/postcss/postcss-loader
         * https://github.com/webpack-contrib/sass-loader
         * https://github.com/webpack-contrib/extract-text-webpack-plugin
         */
        test: /\.(scss|sass)$/,
        exclude: root('src', 'app'),
        use: isTest ? 'null-loader' : ExtractTextPlugin.extract(
          {
            fallback: 'style-loader',
            use: ['css-loader', 'postcss-loader', 'sass-loader']
          }
        )
      },
      {
        /**
         * https://github.com/webpack-contrib/css-loader
         * https://github.com/postcss/postcss-loader
         * https://github.com/webpack-contrib/sass-loader
         */
        test: /\.(scss|sass)$/,
        exclude: root('src', 'style'),
        use: ['raw-loader', 'postcss-loader', 'sass-loader']
      },
      {
        /**
         * https://github.com/webpack-contrib/url-loader
         */
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'url-loader?limit=10000&mimetype=application/font-woff'
      },
      {
        /**
         * https://github.com/webpack-contrib/file-loader
         */
        test: /\.(png|jpe?g|gif|svg|woff|ttf|eot|ico)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'file-loader?name=assets/[name].[hash].[ext]?'
      },
      {
        /**
         * https://github.com/webpack-contrib/json-loader
         */
        test: /\.json$/,
        use: 'json-loader'
      },
      {
        /**
         *
         */
        test: /\.html$/,
        exclude: root('src', 'public'),
        use: ['raw-loader', 'html-loader']
      },
      {
        /**
         *
         */
        test: /\.(pug|jade)$/,
        use: ['raw-loader', 'pug-html-loader']
      }
    ]
  };

  config.plugins = [
    // Define env letiables to help with builds
    // Reference: https://webpack.github.io/docs/list-of-plugins.html#defineplugin
    new webpack.DefinePlugin({
      // Environment helpers
      'process.env': {
        ENV: JSON.stringify(ENV)
      }
    }),

    // Workaround needed for angular 2 angular/angular#11580
    new webpack.ContextReplacementPlugin(
      // The (\\|\/) piece accounts for path separators in *nix and Windows
      /angular(\\|\/)core(\\|\/)@angular/,
      root('./src') // location of your src
    ),
    new webpack.LoaderOptionsPlugin({
      options: {
        /**
         * Apply the tslint loader as pre/postLoader
         * Reference: https://github.com/wbuchwalter/tslint-loader
         */
        tslint: {
          emitErrors: false,
          failOnHint: false
        },
        postcss: [
          autoprefixer({
            browsers: ['last 2 version']
          })
        ]
      }
    })
  ];

  if (!isTest && !isTestWatch) {
    config.plugins.push(
      // Generate common chunks if necessary
      // Reference: https://webpack.github.io/docs/code-splitting.html
      // Reference: https://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin
      new CommonsChunkPlugin({
        name: ['vendor', 'polyfills']
      }),

      // Inject script and link tags into html files
      // Reference: https://github.com/ampedandwired/html-webpack-plugin
      new HtmlWebpackPlugin({
        template: './src/public/index.html',
        chunksSortMode: 'dependency'
      }),

      // Extract css files
      // Reference: https://github.com/webpack/extract-text-webpack-plugin
      // Disabled when in test mode or not in build mode
      new ExtractTextPlugin({filename: 'css/[name].[hash].css', disable: !isProd})
    );
  }

  // Add build specific plugins
  if (isProd) {
    config.plugins.push(
      // Reference: http://webpack.github.io/docs/list-of-plugins.html#noerrorsplugin
      // Only emit files when there are no errors
      new webpack.NoEmitOnErrorsPlugin(),

      // Reference: http://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
      // Minify all javascript, switch loaders to minimizing mode
      new webpack.optimize.UglifyJsPlugin({sourceMap: true, mangle: {keep_fnames: true}}),

      // Copy assets from the public folder
      // Reference: https://github.com/kevlened/copy-webpack-plugin
      new CopyWebpackPlugin([{
        from: root('src/public')
      }])
    );
  }

  config.devServer = {
    contentBase: './src/public',
    historyApiFallback: true,
    quiet: true,
    stats: 'minimal' // none (or false), errors-only, minimal, normal (or true) and verbose
  };

  return config;
}();

// Helper functions
function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [__dirname].concat(args));
}
