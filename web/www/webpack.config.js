const path = require('path');

const src_dir = "./private";
const output_dir = path.resolve(__dirname, 'public');

pages = [
    "test.ts",
    "hideshow.ts",
    "inscription/register.ts",
    "connexion/connect.ts"
];

var entries = {};
for (let page of pages) {
	entries[page.split('.').slice(0, -1).join('.')] = path.resolve(src_dir, page);
}

module.exports = {
    entry: entries,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
		filename: "[name].js",
        path: output_dir,
    },
    devtool: 'inline-source-map',
    mode: 'development',
    devServer: {
        static: [{
            directory: './public',
            watch: true,
        },{
            directory: '../cdn/public',
            watch: true,
            publicPath: '/assets',
        }],
        client: {
            progress: true,
        },
    },
};