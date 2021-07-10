export default function(babel) {
    return {
        visitor: {
            CallExpression(path) {
                if (path.node.callee.name !== 'useFunction') return;
                console.log(path);
            },
        },
    };
}
