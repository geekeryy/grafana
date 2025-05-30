// @ts-check
/** @typedef {import('@typescript-eslint/utils').TSESTree.Node} Node */
/** @typedef {import('@typescript-eslint/utils').TSESTree.JSXElement} JSXElement */
/** @typedef {import('@typescript-eslint/utils').TSESTree.JSXFragment} JSXFragment */
/** @typedef {import('@typescript-eslint/utils').TSESLint.RuleModule<'noUntranslatedStrings' | 'noUntranslatedStringsProp' | 'wrapWithTrans' | 'wrapWithT', [{ forceFix: string[] }]>} RuleDefinition */

const {
  getNodeValue,
  getTFixers,
  getTransFixers,
  canBeFixed,
  elementIsTrans,
  shouldBeFixed,
  isStringNonAlphanumeric,
} = require('./translation-utils.cjs');

const { ESLintUtils, AST_NODE_TYPES } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/grafana/grafana/blob/main/packages/grafana-eslint-rules/README.md#${name}`
);

/** @type {string[]} */
const propsToCheck = ['content', 'label', 'description', 'placeholder', 'aria-label', 'title', 'text', 'tooltip'];

/** @type {RuleDefinition} */
const noUntranslatedStrings = createRule({
  create(context) {
    return {
      JSXAttribute(node) {
        if (!propsToCheck.includes(String(node.name.name)) || !node.value) {
          return;
        }

        const nodeValue = getNodeValue(node);
        const isAlphaNumeric = !isStringNonAlphanumeric(nodeValue);
        const isTemplateLiteral =
          node.value.type === AST_NODE_TYPES.JSXExpressionContainer && node.value.expression.type === 'TemplateLiteral';

        const isUntranslatedProp = (nodeValue.trim() && isAlphaNumeric) || isTemplateLiteral;

        if (isUntranslatedProp) {
          const errorShouldBeFixed = shouldBeFixed(context);
          const errorCanBeFixed = canBeFixed(node, context);
          return context.report({
            node,
            messageId: 'noUntranslatedStringsProp',
            fix: errorShouldBeFixed && errorCanBeFixed ? getTFixers(node, context) : undefined,
            suggest: errorCanBeFixed
              ? [
                  {
                    messageId: 'wrapWithT',
                    fix: getTFixers(node, context),
                  },
                ]
              : undefined,
          });
        }
      },
      JSXExpressionContainer(node) {
        const parent = node.parent;
        const parentType = parent.type;

        const isNotInAttributeOrElement =
          parentType !== AST_NODE_TYPES.JSXAttribute && parentType !== AST_NODE_TYPES.JSXElement;
        const isUnsupportedAttribute =
          parentType === AST_NODE_TYPES.JSXAttribute && !propsToCheck.includes(String(parent.name.name));

        if (isNotInAttributeOrElement || isUnsupportedAttribute) {
          return;
        }

        const { expression } = node;

        /**
         * @param {Node} expr
         */
        const isExpressionUntranslated = (expr) => {
          return expr.type === AST_NODE_TYPES.Literal && typeof expr.value === 'string' && Boolean(expr.value);
        };

        if (expression.type === AST_NODE_TYPES.ConditionalExpression) {
          const alternateIsString = isExpressionUntranslated(expression.alternate);
          const consequentIsString = isExpressionUntranslated(expression.consequent);

          if (alternateIsString || consequentIsString) {
            const messageId =
              parentType === AST_NODE_TYPES.JSXAttribute ? 'noUntranslatedStringsProp' : 'noUntranslatedStrings';

            const nodesToReport = [
              alternateIsString ? expression.alternate : undefined,
              consequentIsString ? expression.consequent : undefined,
            ].filter((node) => !!node);

            nodesToReport.forEach((nodeToReport) => {
              context.report({
                node: nodeToReport,
                messageId,
              });
            });
          }
        }
      },
      /**
       * @param {JSXElement|JSXFragment} node
       */
      'JSXElement, JSXFragment'(node) {
        const parent = node.parent;
        const children = node.children;
        const untranslatedTextNodes = children.filter((child) => {
          if (child.type === AST_NODE_TYPES.JSXText) {
            const nodeValue = child.value.trim();
            if (!nodeValue || isStringNonAlphanumeric(nodeValue)) {
              return false;
            }
            const ancestors = context.sourceCode.getAncestors(node);
            const hasTransAncestor =
              elementIsTrans(node) ||
              ancestors.some((ancestor) => {
                return elementIsTrans(ancestor);
              });
            return !hasTransAncestor;
          }
          return false;
        });

        const parentHasChildren =
          parent.type === AST_NODE_TYPES.JSXElement || parent.type === AST_NODE_TYPES.JSXFragment;

        // We don't want to report if the parent has a text node,
        // as we'd end up doing it twice. This makes it awkward for us to auto fix
        const parentHasText = parentHasChildren
          ? parent.children.some((child) => child.type === AST_NODE_TYPES.JSXText && getNodeValue(child).trim())
          : false;

        if (untranslatedTextNodes.length && !parentHasText) {
          const errorShouldBeFixed = shouldBeFixed(context);
          const errorCanBeFixed = canBeFixed(node, context);
          context.report({
            node,
            messageId: 'noUntranslatedStrings',
            fix: errorShouldBeFixed && errorCanBeFixed ? getTransFixers(node, context) : undefined,
            suggest: errorCanBeFixed
              ? [
                  {
                    messageId: 'wrapWithTrans',
                    fix: getTransFixers(node, context),
                  },
                ]
              : undefined,
          });
        }
      },
    };
  },
  name: 'no-untranslated-strings',
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    fixable: 'code',
    docs: {
      description: 'Check untranslated strings',
    },
    messages: {
      noUntranslatedStrings: 'No untranslated strings. Wrap text with <Trans />',
      noUntranslatedStringsProp: `No untranslated strings in text props. Wrap text with <Trans /> or use t()`,
      wrapWithTrans: 'Wrap text with <Trans /> for manual key assignment',
      wrapWithT: 'Wrap text with t() for manual key assignment',
    },
    schema: [
      {
        type: 'object',
        properties: {
          forceFix: {
            type: 'array',
            items: {
              type: 'string',
            },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ forceFix: [] }],
});

module.exports = noUntranslatedStrings;
