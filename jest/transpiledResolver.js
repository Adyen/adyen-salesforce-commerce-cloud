'use strict';

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const sourceCartridgesRoot = path.join(
    projectRoot,
    'src',
    'cartridges'
);

const transpiledCartridgesRoot = path.join(
    projectRoot,
    'cartridges'
);

const sourceOnlyDirectories = [
    '__tests__',
    '__mocks__',
    '__snapshots__'
];

function isInside(directory, filePath) {
    const relative = path.relative(
        directory,
        filePath
    );

    return (
        relative &&
        !relative.startsWith('..') &&
        !path.isAbsolute(relative)
    );
}

function isSourceOnlyPath(filePath) {
    return sourceOnlyDirectories.some(
        (directory) =>
            filePath
                .split(path.sep)
                .includes(directory)
    );
}

module.exports = function transpiledResolver(
    request,
    options
) {
    /*
     * Only intercept relative requires originating from the original
     * cartridge source tree.
     *
     * Everything else, including node_modules, Jest mocks and dw/*
     * resolution, continues through Jest's normal resolver.
     */
    if (
        process.env.SFCC_TEST_TARGET !== 'transpiled' ||
        !request.startsWith('.') ||
        !isInside(
            sourceCartridgesRoot,
            options.basedir
        )
    ) {
        return options.defaultResolver(
            request,
            options
        );
    }

    /*
     * First let Jest determine exactly which source file this relative
     * request normally resolves to.
     */
    const sourcePath =
        options.defaultResolver(
            request,
            options
        );

    /*
     * Tests, mocks and snapshots must continue coming from the original
     * source tree.
     */
    if (
        !isInside(
            sourceCartridgesRoot,
            sourcePath
        ) ||
        isSourceOnlyPath(sourcePath)
    ) {
        return sourcePath;
    }

    const relativePath = path.relative(
        sourceCartridgesRoot,
        sourcePath
    );

    const transpiledPath = path.join(
        transpiledCartridgesRoot,
        relativePath
    );

    /*
     * Redirect only when the corresponding generated implementation
     * actually exists. Otherwise preserve the original resolution.
     */
    if (fs.existsSync(transpiledPath)) {
        return transpiledPath;
    }

    return sourcePath;
};