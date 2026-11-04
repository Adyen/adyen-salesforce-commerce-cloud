'use strict';

module.exports = function transformAdyenSfccCompatibility({
    types: t
}) {
    const generatedNamesByScope = new WeakMap();

    function clone(node) {
        return t.cloneNode(node, true);
    }

    function createUndefinedCheck(identifier) {
        return t.binaryExpression('===', clone(identifier), t.identifier('undefined'));
    }

    /**
     * Returns true when the optional chain occurs inside the expression body of
     * a concise arrow function.
     *
     * Generated declarations cannot safely be inserted before the statement
     * containing the arrow because they could reference arrow parameters outside
     * their lexical scope.
     *
     * Example:
     *
     *     var getAmount = (currency, currentBasket) =>
     *         currentBasket
     *             ?.getTotalGrossPrice()
     *             .isAvailable()
     *             ? getAmountFromBasket(currentBasket)
     *             : getDefaultAmount(currency);
     *
     * A declaration involving currentBasket must not be inserted before the
     * variable declaration because currentBasket only exists inside the arrow.
     */
    function isInsideConciseArrowBody(path) {
        const functionPath = path.getFunctionParent();

        return Boolean(functionPath && functionPath.isArrowFunctionExpression() && !t.isBlockStatement(functionPath.node.body));
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
     * Returns true when a default can be removed without adding an
     * initialization statement.
     *
     * Only an explicit undefined default is removable. All other
     * defaults are reproduced with an === undefined fallback check.
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
     * JavaScript parameter defaults apply only when the argument is
     * omitted or explicitly undefined. Values such as null, an empty
     * string, zero, and false must be preserved.
     *
     * Example:
     *
     *     function getService(service, reqMethod = 'POST') {
     *
     * becomes:
     *
     *     function getService(service, reqMethod) {
     *         if (reqMethod === undefined) {
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
     *         if (attemptId === undefined) {
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

            /*
             * An explicit undefined default requires no replacement
             * statement after the AssignmentPattern is removed.
             *
             *     function example(value = undefined) {}
             *
             * becomes:
             *
             *     function example(value) {}
             */
            if (!isRemovableParameterDefault(defaultValue)) {
                initializationStatements.push(
                    t.ifStatement(
                        createUndefinedCheck(identifier),
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
         *         if (value === undefined) {
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
     * JavaScript destructuring defaults apply only when the extracted
     * property value is undefined. Values such as null, an empty string,
     * zero, and false must be preserved.
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
     *     if (paymentMethod === undefined) {
     *         paymentMethod = null;
     *     }
     *
     * Example:
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
     *     if (quantity === undefined) {
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
                if (isRemovableParameterDefault(defaultValue)) {
                    return;
                }

                /*
                 * Preserve native JavaScript default semantics. The
                 * fallback is applied only when the extracted value is
                 * undefined, not when it is null, empty, zero, or false.
                 */
                defaultStatements.push(
                    t.ifStatement(
                        createUndefinedCheck(identifier),
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
     * Returns true when the node is an empty-object fallback for the
     * supplied base expression.
     *
     * Example:
     *
     *     storedPaymentMethod || {}
     */
    function isObjectFallbackForBase(node, base) {
        return (
            t.isLogicalExpression(node, {
                operator: '||'
            }) &&
            t.isNodesEquivalent(node.left, base) &&
            t.isObjectExpression(node.right) &&
            node.right.properties.length === 0
        );
    }

    /**
     * Returns true when an expression establishes that the supplied base
     * exists.
     *
     * This recognizes direct guards:
     *
     *     object
     *
     * and property reads through an object fallback:
     *
     *     (object || {}).property
     */
    function expressionGuardsBase(node, base) {
        if (t.isNodesEquivalent(node, base)) {
            return true;
        }

        if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
            if (isObjectFallbackForBase(node.object, base)) {
                return true;
            }

            return expressionGuardsBase(node.object, base);
        }

        if (
            t.isLogicalExpression(node, {
                operator: '&&'
            })
        ) {
            return expressionGuardsBase(node.left, base) || expressionGuardsBase(node.right, base);
        }

        return false;
    }

    /**
     * Determines whether the optional-chain base is already protected by
     * the left side of a surrounding && expression.
     *
     * Example:
     *
     *     (storedPaymentMethod || {})
     *         .supportedShopperInteractions &&
     *     storedPaymentMethod
     *         ?.supportedShopperInteractions
     *         .indexOf('Ecommerce') > -1
     *
     * The left operand already establishes that storedPaymentMethod exists,
     * so the transformed right operand does not need another base guard.
     */
    function isGuardedByLeftSideOfLogicalAnd(path, base) {
        let currentPath = path;

        while (currentPath.parentPath) {
            const parentPath = currentPath.parentPath;

            if (
                parentPath.isLogicalExpression({
                    operator: '&&'
                }) &&
                parentPath.node.right === currentPath.node &&
                expressionGuardsBase(parentPath.node.left, base)
            ) {
                return true;
            }

            currentPath = parentPath;
        }

        return false;
    }

    /**
     * Returns true when the optional-chain base has already been checked
     * either by an enclosing if statement or by the left side of &&.
     */
    function isAlreadyGuarded(path, base) {
        return isGuardedByEnclosingIf(path, base) || isGuardedByLeftSideOfLogicalAnd(path, base);
    }

    /**
     * Returns true when evaluating an expression more than once could repeat
     * a function or method call.
     */
    function containsCallExpression(node) {
        if (t.isCallExpression(node) || t.isOptionalCallExpression(node)) {
            return true;
        }

        if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
            return containsCallExpression(node.object);
        }

        if (t.isLogicalExpression(node)) {
            return containsCallExpression(node.left) || containsCallExpression(node.right);
        }

        if (t.isConditionalExpression(node)) {
            return containsCallExpression(node.test) || containsCallExpression(node.consequent) || containsCallExpression(node.alternate);
        }

        return false;
    }


    /**
     * Converts an accessor method name into a readable result name.
     *
     * Examples:
     *
     *     getProfile           -> profile
     *     getWallet            -> wallet
     *     getPaymentProcessor  -> paymentProcessor
     *     getAbsURL            -> absURL
     *     getCustomerID        -> customerID
     *     getID                -> id
     *     getURL               -> url
     *     getUUID              -> uuid
     *     isAvailable          -> available
     *     isURLValid           -> urlValid
     */
    function normalizeAccessorName(methodName) {
        let value = methodName;

        if (
            value.length > 3 &&
            value.indexOf('get') === 0 &&
            value.charAt(3) ===
                value.charAt(3).toUpperCase()
        ) {
            value = value.substring(3);
        } else if (
            value.length > 2 &&
            value.indexOf('is') === 0 &&
            value.charAt(2) ===
                value.charAt(2).toUpperCase()
        ) {
            value = value.substring(2);
        }

        /*
        * Normalize a completely uppercase accessor result.
        *
        *     ID   -> id
        *     URL  -> url
        *     UUID -> uuid
        */
        if (/^[A-Z0-9]+$/.test(value)) {
            return value.toLowerCase();
        }

        /*
        * Normalize a leading acronym.
        *
        *     URLValue  -> urlValue
        *     UUIDValue -> uuidValue
        */
        value = value.replace(
            /^[A-Z]+(?=[A-Z][a-z])/,
            (prefix) => prefix.toLowerCase()
        );

        /*
        * Ordinary accessor results use lower camel case.
        *
        *     Profile          -> profile
        *     PaymentProcessor -> paymentProcessor
        *     AbsURL           -> absURL
        *     CustomerID       -> customerID
        */
        return (
            value.charAt(0).toLowerCase() +
            value.substring(1)
        );
    }

    /**
     * Returns the set of names generated for the current function or program
     * scope.
     */
    function getGeneratedNamesForScope(path) {
        const ownerScope =
            path.scope.getFunctionParent() ||
            path.scope.getProgramParent();

        if (!generatedNamesByScope.has(ownerScope)) {
            generatedNamesByScope.set(
                ownerScope,
                new Set()
            );
        }

        return generatedNamesByScope.get(
            ownerScope
        );
    }

    /**
     * Returns true when a name is already occupied by source code, a global,
     * or another declaration generated during this plugin traversal.
     */
    function isIdentifierNameUnavailable(
        path,
        name
    ) {
        const generatedNames =
            getGeneratedNamesForScope(path);

        return (
            path.scope.hasBinding(name) ||
            path.scope.hasGlobal(name) ||
            generatedNames.has(name)
        );
    }

    /**
     * Reserves a generated name in the current function or program scope.
     */
    function reserveGeneratedName(
        path,
        name
    ) {
        getGeneratedNamesForScope(path).add(
            name
        );
    }

    /**
     * Returns a readable name hint for a generated optional-chain temporary.
     *
     * Examples:
     *
     *     customer.getProfile()          -> profile
     *     profile.getWallet()            -> wallet
     *     method.getPaymentProcessor()   -> paymentProcessor
     *     processor.getID()              -> id
     */
    function getTemporaryNameHint(expression) {
        if (
            !t.isCallExpression(expression) ||
            !t.isMemberExpression(
                expression.callee
            ) ||
            expression.callee.computed ||
            !t.isIdentifier(
                expression.callee.property
            )
        ) {
            return 'optionalChainValue';
        }

        return normalizeAccessorName(
            expression.callee.property.name
        );
    }

    /**
     * Finds the statement before which an optional-chain temporary can be
     * declared.
     */
    function getTemporaryDeclarationTarget(path) {
        const statementPath = path.getStatementParent();

        if (!statementPath) {
            throw path.buildCodeFrameError('Could not find a containing statement for an ' + 'optional-chain temporary.');
        }

        return statementPath;
    }

    /**
     * Declares a scoped temporary variable before the statement containing
     * the optional chain.
     */
    function createChainTemporary(
        path,
        expression
    ) {
        const identifier =
            createReadableIdentifier(
                path,
                getTemporaryNameHint(expression)
            );

        const declaration =
            t.variableDeclaration('var', [
                t.variableDeclarator(
                    clone(identifier),
                    null
                )
            ]);

        const targetPath =
            getTemporaryDeclarationTarget(path);

        targetPath.insertBefore(
            declaration
        );

        return identifier;
    }

    /**
     * Replaces a call-based intermediate receiver with an assignment to a
     * generated temporary.
     *
     * Example:
     *
     *     customer?.getProfile()?.getWallet()
     *
     * becomes approximately:
     *
     *     var _profile;
     *
     *     customer &&
     *         (_profile = customer.getProfile()) &&
     *         _profile.getWallet()
     *
     * This checks the result of getProfile(), not whether getProfile itself
     * exists.
     */
    function cacheIntermediateExpression(path, expression) {
        const identifier = createChainTemporary(path, expression);

        return {
            guardExpression: t.assignmentExpression('=', clone(identifier), clone(expression)),
            currentExpression: clone(identifier)
        };
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
     * Returns a readable name for the value produced by an expression.
     *
     * Examples:
     *
     *     customer.getProfile()      -> profile
     *     profile.getWallet()        -> wallet
     *     method.getProcessor()      -> processor
     *     processor.getID()          -> id
     *     source.find(...)           -> findResult
     */
    function getExpressionNameHint(expression) {
        let propertyName = null;

        if (
            t.isCallExpression(expression) &&
            t.isMemberExpression(
                expression.callee
            ) &&
            !expression.callee.computed &&
            t.isIdentifier(
                expression.callee.property
            )
        ) {
            propertyName =
                expression.callee.property.name;
        } else if (
            t.isMemberExpression(expression) &&
            !expression.computed &&
            t.isIdentifier(expression.property)
        ) {
            propertyName =
                expression.property.name;
        }

        if (!propertyName) {
            return 'optionalChainValue';
        }

        if (
            propertyName.indexOf('get') === 0 ||
            propertyName.indexOf('is') === 0
        ) {
            return normalizeAccessorName(
                propertyName
            );
        }

        if (t.isCallExpression(expression)) {
            return `${propertyName}Result`;
        }

        return propertyName;
    }

    /**
     * Creates a readable identifier while avoiding collisions with source
     * bindings, globals, and names generated earlier in the same scope.
     *
     * Normal output:
     *
     *     profile
     *     wallet
     *
     * Collision output:
     *
     *     profile2
     *     wallet2
     */
    function createReadableIdentifier(
        path,
        nameHint
    ) {
        if (
            !isIdentifierNameUnavailable(
                path,
                nameHint
            )
        ) {
            reserveGeneratedName(
                path,
                nameHint
            );

            return t.identifier(nameHint);
        }

        let suffix = 2;
        let candidate =
            `${nameHint}${suffix}`;

        while (
            isIdentifierNameUnavailable(
                path,
                candidate
            )
        ) {
            suffix += 1;
            candidate =
                `${nameHint}${suffix}`;
        }

        reserveGeneratedName(
            path,
            candidate
        );

        return t.identifier(candidate);
    }

    /**
     * Creates the identifier used to hold the result of an optional-chain
     * segment.
     */
    function createResultIdentifier(path, expression) {
        return createReadableIdentifier(path, getExpressionNameHint(expression));
    }
    /**
     * Inserts generated declarations before the statement containing the
     * optional chain.
     */
    function insertDeclarationsBeforeStatement(path, declarations) {
        if (!declarations.length) {
            return;
        }

        const statementPath = path.getStatementParent();

        if (!statementPath) {
            throw path.buildCodeFrameError('Could not find a containing statement for ' + 'readable optional-chain declarations.');
        }

        statementPath.insertBefore(declarations);
    }

    /**
     * Returns true when an operation starts a new optional segment.
     */
    function startsOptionalSegment(operation) {
        return Boolean(operation.optional);
    }

    /**
     * Divides a flattened chain into segments.
     *
     * Each optional operation starts a new segment. Normal operations after
     * it remain in that segment until another optional operation is reached.
     *
     * Example:
     *
     *     customer?.getProfile()?.getWallet()
     *
     * becomes:
     *
     *     segment 1: ?.getProfile()
     *     segment 2: ?.getWallet()
     */
    function splitIntoOptionalSegments(operations) {
        const leadingOperations = [];
        const segments = [];
        let currentSegment = null;

        operations.forEach((operation) => {
            if (startsOptionalSegment(operation)) {
                currentSegment = {
                    operations: []
                };

                segments.push(currentSegment);
            }

            if (currentSegment) {
                currentSegment.operations.push(operation);
            } else {
                leadingOperations.push(operation);
            }
        });

        return {
            leadingOperations,
            segments
        };
    }

    /**
     * Applies a list of operations while treating optional flags as segment
     * markers rather than method-existence checks.
     */
    function applySegmentOperations(receiver, operations) {
        return operations.reduce((current, operation) => {
            return applyOperation(
                current,
                Object.assign({}, operation, {
                    optional: false
                })
            );
        }, clone(receiver));
    }

    /**
     * Returns true when the optional chain is the complete expression in an
     * ExpressionStatement and its resulting value is ignored.
     *
     * Examples:
     *
     *     fileReader?.close();
     *     storedPaymentMethods?.forEach(callback);
     *
     * These should remain guarded expression statements. A variable should not
     * be created solely to hold an unused return value.
     */
    function isIgnoredExpressionResult(path) {
        return Boolean(
            path.parentPath &&
            path.parentPath.isExpressionStatement() &&
            path.parentPath.node.expression ===
                path.node
        );
    }

    /**
     * Returns true when a chain containing calls can safely be represented by
     * initialized declarations before its containing statement.
     *
     * Ignored expression results stay as guarded expression statements.
     *
     * Repeated boolean conditions stay inside the expression because they must
     * be recalculated each time they are evaluated.
     *
     * Concise arrow bodies also stay as expressions because generated
     * declarations cannot be inserted outside the arrow's lexical scope.
     */
    function canBuildReadableCallDeclarations(
        path,
        base,
        operations
    ) {
        const hasCall =
            t.isCallExpression(base) ||
            operations.some(
                (operation) =>
                    operation.type === 'call'
            );

        if (!hasCall) {
            return false;
        }

        /*
        * Do not generate result variables for calls whose result is ignored.
        *
        * Example:
        *
        *     fileReader?.close();
        *
        * should become:
        *
        *     fileReader &&
        *         fileReader.close();
        */
        if (isIgnoredExpressionResult(path)) {
            return false;
        }

        /*
        * Conditions in loops and similar constructs may need to be evaluated
        * repeatedly.
        */
        if (isBooleanChainContext(path)) {
            return false;
        }

        /*
        * Do not insert declarations before a concise arrow function. The
        * optional chain may reference parameters that exist only inside the
        * arrow.
        */
        if (isInsideConciseArrowBody(path)) {
            return false;
        }

        return Boolean(
            path.getStatementParent()
        );
    }

    /**
     * Converts a call-based optional chain into readable declarations.
     *
     * Every explicit optional boundary becomes one guarded initializer.
     * Documented methods are called directly once their receiver exists.
     *
     * Example:
     *
     *     customer?.getProfile()?.getWallet()
     *
     * becomes:
     *
     *     var profile =
     *         customer && customer.getProfile();
     *
     *     var wallet =
     *         profile && profile.getWallet();
     *
     * The original chain expression is then replaced by wallet.
     */
    function buildReadableCallDeclarations(path, base, operations) {
        const parts = splitIntoOptionalSegments(operations);

        let receiver = clone(base);
        const declarations = [];

        /*
         * Apply any normal operations that occur before the first optional
         * boundary.
         */
        if (parts.leadingOperations.length) {
            receiver = applySegmentOperations(receiver, parts.leadingOperations);
        }

        /*
         * A call expression used as the base must be evaluated once before
         * it is used as an optional receiver.
         *
         * Example:
         *
         *     PaymentMgr.getPaymentMethod(...)?.getProcessor()
         */
        if (t.isCallExpression(receiver) && parts.segments.length) {
            const baseIdentifier = createResultIdentifier(path, receiver);

            declarations.push(t.variableDeclaration('var', [t.variableDeclarator(clone(baseIdentifier), clone(receiver))]));

            receiver = clone(baseIdentifier);
        }

        parts.segments.forEach((segment) => {
            const segmentValue = applySegmentOperations(receiver, segment.operations);

            const resultIdentifier = createResultIdentifier(path, segmentValue);

            const initializer = t.logicalExpression('&&', clone(receiver), clone(segmentValue));

            declarations.push(t.variableDeclaration('var', [t.variableDeclarator(clone(resultIdentifier), initializer)]));

            receiver = clone(resultIdentifier);
        });

        insertDeclarationsBeforeStatement(path, declarations);

        return receiver;
    }

    /**
     * Returns true when the optional chain itself is consumed directly as a
     * boolean condition.
     *
     * Logical expressions such as:
     *
     *     object?.property || fallback
     *
     * are not automatically considered boolean contexts. The optional-chain
     * result is being used as a value, so the object-fallback transform can
     * still be applied.
     */
    function isBooleanChainContext(path) {
        const parent = path.parentPath;

        if (!parent) {
            return false;
        }

        if (
            (parent.isIfStatement() || parent.isWhileStatement() || parent.isDoWhileStatement() || parent.isConditionalExpression()) &&
            parent.node.test === path.node
        ) {
            return true;
        }

        if (parent.isForStatement() && parent.node.test === path.node) {
            return true;
        }

        if (
            parent.isUnaryExpression({
                operator: '!'
            })
        ) {
            return true;
        }

        return false;
    }

    /**
     * Returns true when object fallbacks can safely represent the optional
     * portion of the chain.
     *
     * Normal calls and property accesses are allowed before the first optional
     * property. From the first optional operation onward, every operation must
     * be an optional property read.
     *
     * Supported:
     *
     *     response?.paymentMethod
     *     response._links?.next?.href
     *     JSON.parse(data).installments?.value
     *
     * Not supported:
     *
     *     fileReader?.close()
     *     object.method?.()
     *     object?.method()
     */
    function canUseObjectFallback(operations) {
        const firstOptionalIndex = operations.findIndex((operation) => operation.optional);

        if (firstOptionalIndex === -1) {
            return false;
        }

        return operations.slice(firstOptionalIndex).every((operation) => operation.type === 'member' && operation.optional);
    }

    /**
     * Converts the optional property portion of a chain into object
     * fallbacks while preserving all normal operations before it.
     *
     * Example:
     *
     *     JSON.parse(data).installments?.value
     *
     * becomes:
     *
     *     (JSON.parse(data).installments || {}).value
     *
     * Example:
     *
     *     response._links?.next?.href
     *
     * becomes:
     *
     *     (((response._links || {}).next || {}).href)
     */
    function buildObjectFallbackChain(base, operations) {
        let current = clone(base);

        operations.forEach((operation) => {
            if (operation.type === 'member') {
                const receiver = operation.optional ? t.logicalExpression('||', clone(current), t.objectExpression([])) : clone(current);

                current = t.memberExpression(receiver, clone(operation.property), operation.computed);

                return;
            }

            /*
             * Calls are allowed before the first optional property.
             * canUseObjectFallback() ensures that no calls occur after
             * the optional portion begins.
             */
            current = applyOperation(current, operation);
        });

        return current;
    }

    /**
     * Builds the readable && representation for boolean checks, method calls,
     * and mixed optional/non-optional chains.
     *
     * Each optional boundary checks the value immediately before that
     * boundary. Native methods are called directly once their receiver has
     * been established.
     *
     * Intermediate expressions containing calls are cached so that calls such
     * as getProfile(), getWallet(), getPaymentMethod(), and
     * getPaymentProcessor() are never executed more than once by the generated
     * guard expression.
     */
    function buildAndChain(path, base, operations) {
        let current = clone(base);
        const expressions = [];

        operations.forEach((operation) => {
            if (operation.optional) {
                if (containsCallExpression(current)) {
                    const cached = cacheIntermediateExpression(path, current);

                    expressions.push(cached.guardExpression);

                    current = cached.currentExpression;
                } else {
                    expressions.push(clone(current));
                }
            }

            current = applyOperation(current, operation);
        });

        if (expressions.length === 0) {
            return current;
        }

        /*
         * If there is only one guard and an earlier condition already
         * establishes that the base exists, emitting the same base guard
         * again is unnecessary.
         */
        if (expressions.length === 1 && isAlreadyGuarded(path, base)) {
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
     * Converts a complete optional chain into a readable SFCC-compatible
     * expression.
     *
     * Property-only value reads use object fallbacks.
     *
     * Chains containing calls are divided into optional segments. Each
     * segment becomes an initialized variable so every call is evaluated once
     * and every explicit optional boundary is preserved.
     */
    function buildLogicalChain(path, node) {
        const {
            base,
            operations
        } = flattenChain(node);

        if (canUseObjectFallback(operations) && !isBooleanChainContext(path)) {
            return buildObjectFallbackChain(base, operations);
        }

        if (canBuildReadableCallDeclarations(path, base, operations)) {
            return buildReadableCallDeclarations(path, base, operations);
        }

        return buildAndChain(path, base, operations);
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

                    const directives = path.node.directives || [];

                    const alreadyStrict = directives.some((directive) => directive.value.value === 'use strict');

                    if (!alreadyStrict) {
                        directives.unshift(t.directive(t.directiveLiteral('use strict')));

                        path.node.directives = directives;
                    }
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