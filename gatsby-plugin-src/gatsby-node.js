const path = require('path');
const fs = require('fs');
var glob = require('glob');


/*exports.onPostBootstrap  = (x) => {

    console.log('Starting PressLess...')

    //let entryPath = path.resolve(__dirname, './wp/index.js')
    let entryPath = path.resolve(process.cwd(), './pressless-config.js')

    let outputPath = path.resolve(process.cwd(), './public/__editor__/')

    const {exec} = require('child_process');

    const activeEnv = process.env.GATSBY_ACTIVE_ENV || process.env.NODE_ENV || 'development'

    childProc = exec(`webpack${activeEnv === 'development' ? ' watch' : ''} --config ${  __dirname  }/webpack.config.js --env entryPath=${  entryPath  } --env outputPath=${  outputPath}`)

    childProc.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    childProc.stderr.on('data', data => {
        console.error(`stderr: ${data}`);
    });


    childProc.on('error', (error) => {
        console.error(`error: ${error.message}`);
    });

    childProc.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });


}*/

exports.onCreateBabelConfig = ({ actions }) => {
    if (process.env.NODE_ENV !== 'development') {
        actions.setBabelPlugin({
            name: '@babel/plugin-transform-regenerator',
            options: {},
        });
        actions.setBabelPlugin({
            name: '@babel/plugin-transform-runtime',
            options: {},
        });
    }
};

let childProc;

exports.onCreateWebpackConfig = ({ stage, getConfig, actions }) => {

    //let entryPath = path.resolve(process.cwd(), './pressless-config.js')
    //let outputPath = path.resolve(process.cwd(), './public/__editor__/')


    if (stage === 'build-javascript' || stage === 'develop') {
        const config = getConfig()

        //let presslessConfig = config;

        //presslessConfig.entry = { ...config.entry, 'pressless': entryPath }
        /*presslessConfig.output = {
            path: outputPath,
            filename: 'bundle.js',
            publicPath: '/'
        };
        presslessConfig.resolve = {
            ...presslessConfig.resolve,
            alias: {
                'gatsby$': path.resolve(__dirname, './src/webpack/faux-g.js')
            }
        }*/

        //actions.replaceWebpackConfig(presslessConfig)


        let outputPath = path.resolve(process.cwd(), './public/__editor__/')

        const {exec} = require('child_process');

        const activeEnv = process.env.GATSBY_ACTIVE_ENV || process.env.NODE_ENV || 'development'
        let modulePath = path.resolve(__dirname, './node_modules')

        childProc = exec(`node ${modulePath}/webpack-cli/bin/cli.js ${activeEnv === 'development' ? ' watch' : ''} --config ${  __dirname  }/webpack/webpack.config.js --env outputPath=${  outputPath}`)

        childProc.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        childProc.stderr.on('data', data => {
            console.error(`stderr: ${data}`);
        });

        childProc.on('error', (error) => {
            console.error(`error: ${error.message}`);
        });

        childProc.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    }

}
