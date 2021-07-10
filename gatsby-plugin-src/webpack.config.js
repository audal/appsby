const path = require("path")
const glob = require("glob");
const webpack = require("webpack");
const fse = require("fs-extra");
const fs = require("fs");

module.exports = (env) => {

    let templatesArray = [];
    templatesArray = templatesArray.concat(glob.sync('**/*.js', { cwd: 'src/templates' }));
    templatesArray = templatesArray.concat(glob.sync('**/*.jsx', { cwd: 'src/templates' }));
    templatesArray = templatesArray.concat(glob.sync('**/*.tsx', { cwd: 'src/templates' }));
    fse.ensureFileSync(path.resolve(process.cwd(), './.appsby/index.js'))

    let importString = ""

    templatesArray.forEach(template => { importString += `import ${path.basename(template, path.extname(template))} from "../../src/templates/${template}";\r\n` });
    importString += `export {${templatesArray.map(template => path.basename(template, path.extname(template)))}}`

    fs.writeFileSync(path.resolve(process.cwd(), './.cache/pressless-imports/index.js'), importString)

    return {
        entry: {
            bundle: path.resolve(__dirname, './entry.js'),
        },
        mode: 'development',
        output: {
            path: env.outputPath,
            filename: '[name].js',
            publicPath: ''
        },
        /*externals: {
            react: 'React',
            'react-dom': 'ReactDOM'
        },*/
        devtool: false,
        resolveLoader: {
            modules: [
                path.resolve(__dirname, './node_modules'),
                path.resolve(__dirname, './'),
                path.resolve(process.cwd(), './node_modules')
            ],
            extensions: ['.js', '.json'],
            mainFields: ['loader', 'main']
        },
        resolve: {
            modules: [
                path.resolve(__dirname, './node_modules'),
                path.resolve(__dirname, './'),
                path.resolve(process.cwd(), './node_modules'),
            ],
            extensions: ['.js', '.jsx'],
            alias: {
                'gatsby$': path.resolve(__dirname, './faux-g.js'),
                'pressless-templates': path.resolve(process.cwd(), './.cache/pressless-imports')
            },
            fallback: { "buffer": require.resolve("buffer/") }
        },
        plugins: [
            new webpack.DefinePlugin({
                "process.env.___presslessImports": JSON.stringify(templatesArray),
                "process.env.___presslessCWD": process.cwd()
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env', "@babel/preset-react"],
                            plugins: ["@babel/plugin-proposal-class-properties", "@babel/plugin-transform-runtime"]
                        }
                    }
                },
                {
                    test: /\.svg$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'svg-react-loader',
                        options: {
                            tag: 'svg'
                        },
                    },
                },
                {
                    test: /\.css$/,
                    exclude: /node_modules/,
                    use: [
                        { loader: 'style-loader' },
                        {
                            loader: 'css-loader',
                            options: {
                                modules: {
                                    localIdentName: '[name]__[local]___[hash:base64:5]',
                                },
                                sourceMap: true
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: [
                                        [ 'autoprefixer', {}, ],
                                    ],
                                },
                            }
                        }
                    ]
                },
                {
                    test: /\.(png|jpe?g|gif)$/,
                    loader: 'url-loader',
                }
            ]
        }
    }

};
