'use strict';

module.exports = function transformAdyenSfccCompatibility({ types: t }) {
    function clone(node) {
        return t.cloneNode(node, true);
    }

    /**
     * Converts an SFCC collection for...of loop into an iterator loop.
     *
     * Example:
     *
     *     for (var item of collection.toArray()) {
     *         process(item);
     *     }
     *
     * becomes:
     *
     *     var itemIterator = collection.iterator();
     *
     *     while (itemIterator.hasNext()) {
     *         var item = itemIterator.next();
     *         process(item);
     *     }
     */
    function transformForOfToIterator(path) {
        const left = path.node.left;
        const right = path.node.right;

        if (!t.isVariableDeclaration(left) || left.declarations.length !== 1) {
            throw path.buildCodeFrameError('Readable for...of transform requires a single ' + 'variable declaration.');
        }

        const itemDeclaration = left.declarations[0];

        if (!t.isIdentifier(itemDeclaration.id)) {
            throw path.buildCodeFrameError('Readable for...of transform requires an ' + 'identifier loop variable.');
        }

        if (
            !t.isCallExpression(right) ||
            !t.isMemberExpression(right.callee) ||
            right.callee.computed ||
            !t.isIdentifier(right.callee.property, {
                name: 'toArray'
            })
        ) {
            throw path.buildCodeFrameError('Readable for...of transform only supports ' + 'SFCC collections ending in .toArray().');
        }

        const itemIdentifier = clone(itemDeclaration.id);

        const iteratorIdentifier = path.scope.generateUidIdentifier(`${itemIdentifier.name}Iterator`);

        const iteratorDeclaration = t.variableDeclaration('var', [
            t.variableDeclarator(
                clone(iteratorIdentifier),
                t.callExpression(t.memberExpression(clone(right.callee.object), t.identifier('iterator')), [])
            )
        ]);

        const currentItemDeclaration = t.variableDeclaration('var', [
            t.variableDeclarator(clone(itemIdentifier), t.callExpression(t.memberExpression(clone(iteratorIdentifier), t.identifier('next')), []))
        ]);

        const originalBody = t.isBlockStatement(path.node.body) ? clone(path.node.body) : t.blockStatement([clone(path.node.body)]);

        originalBody.body.unshift(currentItemDeclaration);

        const whileStatement = t.whileStatement(
            t.callExpression(t.memberExpression(clone(iteratorIdentifier), t.identifier('hasNext')), []),
            originalBody
        );

        t.inheritsComments(iteratorDeclaration, path.node);

        path.replaceWithMultiple([iteratorDeclaration, whileStatement]);
    }

    /**
     * Returns true when a parameter default can be removed without
     * adding an initialization statement.
     *
     * Only an explicit undefined default is removable. Explicit null
     * defaults are preserved through an empty() fallback assignment.
     *
     * Example:
     *
     *     value = undefined
     */
    function isRemovableParameterDefault(node) {
        return t.isIdentifier(node) && node.name === 'undefined';
    }

    /**
     * Converts function default parameters into readable initialization
     * statements suitable for SFCC server-side code.
     *
     * Example:
     *
     *     function getService(service, reqMethod = 'POST') {
     *
     * becomes:
     *
     *     function getService(service, reqMethod) {
     *         if (empty(reqMethod)) {
     *             reqMethod = 'POST';
     *         }
     *
     * Example:
     *
     *     function submitData(requestObject, attemptId = null) {
     *
     * becomes:
     *
     *     function submitData(requestObject, attemptId) {
     *         if (empty(attemptId)) {
     *             attemptId = null;
     *         }
     *     }
     */
    function transformDefaultParameters(path) {
        const initializationStatements = [];
        let changed = false;

        path.node.params = path.node.params.map((parameter) => {
            if (!t.isAssignmentPattern(parameter)) {
                return parameter;
            }

            if (!t.isIdentifier(parameter.left)) {
                throw path.buildCodeFrameError('Default parameters using destructuring are not ' + 'supported by the readable parameter transform.');
            }

            changed = true;

            const identifier = clone(parameter.left);
            const defaultValue = clone(parameter.right);

            if (!isRemovableParameterDefault(defaultValue)) {
                initializationStatements.push(
                    t.ifStatement(
                        t.callExpression(t.identifier('empty'), [clone(identifier)]),
                        t.blockStatement([t.expressionStatement(t.assignmentExpression('=', clone(identifier), defaultValue))])
                    )
                );
            }

            return identifier;
        });

        if (!changed || initializationStatements.length === 0) {
            return;
        }

        /*
         * A concise arrow function has an expression body, so convert it
         * into a block before inserting the initialization statements.
         *
         * Example:
         *
         *     (value = 'default') => value
         *
         * becomes:
         *
         *     (value) => {
         *         if (empty(value)) {
         *             value = 'default';
         *         }
         *
         *         return value;
         *     }
         */
        if (path.isArrowFunctionExpression() && !t.isBlockStatement(path.node.body)) {
            path.node.body = t.blockStatement([...initializationStatements, t.returnStatement(clone(path.node.body))]);

            return;
        }

        if (!t.isBlockStatement(path.node.body)) {
            throw path.buildCodeFrameError('Cannot insert readable default-parameter logic into ' + 'a function without a block body.');
        }

        path.node.body.body.unshift(...initializationStatements);
    }

    /**
     * Converts unsupported defaults inside object destructuring while
     * preserving the destructuring itself.
     *
     * Example:
     *
     *     var {
     *         paymentMethod = null
     *     } = source;
     *
     * becomes:
     *
     *     var {
     *         paymentMethod
     *     } = source;
     *
     *     if (empty(paymentMethod)) {
     *         paymentMethod = null;
     *     }
     *
     * Other defaults are moved into the same explicit empty() check:
     *
     *     var {
     *         quantity = 1
     *     } = source;
     *
     * becomes:
     *
     *     var {
     *         quantity
     *     } = source;
     *
     *     if (empty(quantity)) {
     *         quantity = 1;
     *     }
     *
     * An explicit undefined default does not require a replacement
     * statement.
     */
    function transformObjectDestructuringDefaults(path) {
        const defaultStatements = [];
        let changed = false;

        path.node.declarations.forEach((declaration) => {
            if (!t.isObjectPattern(declaration.id)) {
                return;
            }

            declaration.id.properties.forEach((property) => {
                if (!t.isObjectProperty(property) || !t.isAssignmentPattern(property.value)) {
                    return;
                }

                const assignment = property.value;

                if (!t.isIdentifier(assignment.left)) {
                    throw path.buildCodeFrameError('Destructuring defaults must use an identifier.');
                }

                changed = true;

                const identifier = clone(assignment.left);

                const defaultValue = clone(assignment.right);

                /*
                 * Keep the destructuring property but remove the
                 * unsupported default assignment.
                 */
                property.value = clone(identifier);
                property.shorthand = !property.computed && t.isIdentifier(property.key) && property.key.name === identifier.name;

                /*
                 * An explicit undefined default produces the same result
                 * after the unsupported assignment syntax is removed.
                 */
                if (t.isIdentifier(defaultValue) && defaultValue.name === 'undefined') {
                    return;
                }

                /*
                 * Preserve all other defaults, including explicit null,
                 * using SFCC's global empty() function.
                 */
                defaultStatements.push(
                    t.ifStatement(
                        t.callExpression(t.identifier('empty'), [clone(identifier)]),
                        t.blockStatement([t.expressionStatement(t.assignmentExpression('=', clone(identifier), defaultValue))])
                    )
                );
            });
        });

        if (!changed || defaultStatements.length === 0) {
            return;
        }

        path.insertAfter(defaultStatements);
    }

    function removeAdyenHeader(comments) {
        if (!comments) {
            return comments;
        }

        return comments.filter((comment) => {
            const value = comment.value;

            const isAdyenHeader = value.includes('Adyen Salesforce Commerce Cloud') && value.includes('Copyright') && value.includes('LICENSE');

            return !isAdyenHeader;
        });
    }

    function removeAdyenHeaders(path) {
        if (path.node.comments) {
            path.node.comments = removeAdyenHeader(path.node.comments);
        }

        path.traverse({
            enter(childPath) {
                if (childPath.node.leadingComments) {
                    childPath.node.leadingComments = removeAdyenHeader(childPath.node.leadingComments);
                }

                if (childPath.node.innerComments) {
                    childPath.node.innerComments = removeAdyenHeader(childPath.node.innerComments);
                }

                if (childPath.node.trailingComments) {
                    childPath.node.trailingComments = removeAdyenHeader(childPath.node.trailingComments);
                }
            }
        });
    }

    /**
     * Determines whether the parent continues the current member or
     * function-call chain.
     *
     * For example:
     *
     *     currentBasket?.getTotalGrossPrice().isAvailable()
     *
     * must be transformed as one complete expression.
     */
    function parentContinuesChain(path) {
        const parent = path.parentPath;

        if (!parent) {
            return false;
        }

        if ((parent.isOptionalMemberExpression() || parent.isMemberExpression()) && parent.node.object === path.node) {
            return true;
        }

        if ((parent.isOptionalCallExpression() || parent.isCallExpression()) && parent.node.callee === path.node) {
            return true;
        }

        return false;
    }

    /**
     * Finds the outermost member or call expression belonging to the
     * optional chain.
     */
    function getOutermostChainPath(path) {
        let current = path;

        while (parentContinuesChain(current)) {
            current = current.parentPath;
        }

        return current;
    }

    /**
     * Determines whether the optional-chain base is already checked by
     * an enclosing if statement.
     *
     * This supports nested blocks and callback functions, for example:
     *
     *     if (items) {
     *         Transaction.wrap(() => {
     *             items?.forEach(callback);
     *         });
     *     }
     */
    function isGuardedByEnclosingIf(path, base) {
        let currentPath = path;

        while (currentPath.parentPath) {
            const parentPath = currentPath.parentPath;

            if (parentPath.isIfStatement() && parentPath.node.consequent === currentPath.node && t.isNodesEquivalent(parentPath.node.test, base)) {
                return true;
            }

            currentPath = parentPath;
        }

        return false;
    }

    /**
     * Flattens a complete member/call chain into:
     *
     * {
     *     base,
     *     operations
     * }
     */
    function flattenChain(node) {
        if (t.isOptionalMemberExpression(node) || t.isMemberExpression(node)) {
            const chain = flattenChain(node.object);

            chain.operations.push({
                type: 'member',
                property: clone(node.property),
                computed: Boolean(node.computed),
                optional: Boolean(node.optional)
            });

            return chain;
        }

        if (t.isOptionalCallExpression(node) || t.isCallExpression(node)) {
            const chain = flattenChain(node.callee);

            chain.operations.push({
                type: 'call',
                arguments: node.arguments.map(clone),
                optional: Boolean(node.optional)
            });

            return chain;
        }

        return {
            base: clone(node),
            operations: []
        };
    }

    /**
     * Applies one member or call operation to the current expression.
     */
    function applyOperation(current, operation) {
        if (operation.type === 'member') {
            return t.memberExpression(clone(current), clone(operation.property), operation.computed);
        }

        if (operation.type === 'call') {
            return t.callExpression(clone(current), operation.arguments.map(clone));
        }

        throw new Error(`Unsupported optional-chain operation: ${operation.type}`);
    }

    /**
     * Converts a complete optional chain into an && expression.
     */
    function buildLogicalChain(path, node) {
        const { base, operations } = flattenChain(node);
        let current = clone(base);
        const expressions = [];

        operations.forEach((operation) => {
            if (operation.optional) {
                expressions.push(clone(current));
            }

            current = applyOperation(current, operation);
        });

        if (expressions.length === 0) {
            return current;
        }

        if (expressions.length === 1 && isGuardedByEnclosingIf(path, base)) {
            return current;
        }

        expressions.push(current);

        return expressions.reduce((result, expression) => {
            if (!result) {
                return clone(expression);
            }

            return t.logicalExpression('&&', result, clone(expression));
        }, null);
    }

    /**
     * Replaces the complete chain containing the supplied optional node.
     */
    function transformChain(path) {
        const outermostPath = getOutermostChainPath(path);

        const replacement = buildLogicalChain(outermostPath, outermostPath.node);

        t.inheritsComments(replacement, outermostPath.node);

        outermostPath.replaceWith(replacement);
    }

    /**
     * Changes concise arrow functions returning ternaries into an
     * explicit block and return statement.
     */
    function addBlockToConditionalArrow(path) {
        if (t.isBlockStatement(path.node.body)) {
            return;
        }

        if (!t.isConditionalExpression(path.node.body)) {
            return;
        }

        path.node.body = t.blockStatement([t.returnStatement(clone(path.node.body))]);
    }

    /**
     * Converts Object.hasOwn() into an SFCC-compatible property check.
     *
     * Example:
     *
     *     Object.hasOwn(object, key)
     *
     * becomes:
     *
     *     Object.prototype.hasOwnProperty.call(object, key)
     */
    function transformObjectHasOwn(path) {
        const callee = path.node.callee;

        if (
            !t.isMemberExpression(callee) ||
            callee.computed ||
            !t.isIdentifier(callee.object, {
                name: 'Object'
            }) ||
            !t.isIdentifier(callee.property, {
                name: 'hasOwn'
            })
        ) {
            return;
        }

        /*
         * Do not transform Object.hasOwn() when Object is a locally
         * declared variable or function parameter.
         */
        if (path.scope.getBinding('Object')) {
            return;
        }

        if (path.node.arguments.length !== 2) {
            throw path.buildCodeFrameError('Object.hasOwn() must have exactly two arguments.');
        }

        const objectArgument = clone(path.node.arguments[0]);

        const propertyArgument = clone(path.node.arguments[1]);

        path.replaceWith(
            t.callExpression(
                t.memberExpression(
                    t.memberExpression(t.memberExpression(t.identifier('Object'), t.identifier('prototype')), t.identifier('hasOwnProperty')),
                    t.identifier('call')
                ),
                [objectArgument, propertyArgument]
            )
        );
    }

    return {
        name: 'transform-adyen-sfcc-compatibility',

        manipulateOptions(_options, parserOpts) {
            parserOpts.plugins = parserOpts.plugins || [];

            if (!parserOpts.plugins.includes('optionalChaining')) {
                parserOpts.plugins.push('optionalChaining');
            }
        },

        visitor: {
            Program: {
                enter(path) {
                    removeAdyenHeaders(path);
                }
            },

            VariableDeclaration: {
                exit(path) {
                    transformObjectDestructuringDefaults(path);
                }
            },

            OptionalMemberExpression: {
                enter(path) {
                    transformChain(path);
                }
            },

            OptionalCallExpression: {
                enter(path) {
                    transformChain(path);
                }
            },

            ArrowFunctionExpression: {
                exit(path) {
                    addBlockToConditionalArrow(path);
                }
            },

            Function: {
                enter(path) {
                    transformDefaultParameters(path);
                }
            },

            ForOfStatement: {
                exit(path) {
                    transformForOfToIterator(path);
                }
            },

            CallExpression: {
                exit(path) {
                    transformObjectHasOwn(path);
                }
            }
        }
    };
};
