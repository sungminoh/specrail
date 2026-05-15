/**
 * Entity verification rule — ENT-{Name}.
 *
 * The entity name is the part after `ENT-`. The rule looks for a symbol
 * with that name (interface / type / class / enum / const) anywhere under
 * `src/`. Found → Built; not found → NotBuilt; ambiguous → ManualReview.
 *
 * Spec ENTs may carry suffixes like `(DELTA mode)` — we strip the first
 * parenthesised tail before the symbol lookup.
 */

import type { IdRule } from '../runner.js';
import { findSymbol } from '../evidence/fs.js';

export const entRule: IdRule = {
  id: 'ent-symbol',
  async apply({ id, idType, ctx }) {
    const rawName = id.slice('ENT-'.length);
    const entityName = rawName.split(/[\s(]/)[0];

    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(entityName)) {
      return {
        id,
        idType,
        intent: ctx.intents.get(id) ?? 'Draft',
        reality: 'ManualReview',
        evidence: [
          {
            kind: 'unparseable-entity-name',
            note: `Cannot derive symbol from "${id}"`,
          },
        ],
        confidence: 'low',
        rule: 'ent-symbol',
      };
    }

    const hit = await findSymbol(ctx.projectRoot, 'src', entityName);
    if (hit) {
      return {
        id,
        idType,
        intent: ctx.intents.get(id) ?? 'Draft',
        reality: 'Built',
        evidence: [
          { kind: 'symbol-found', path: hit.file, line: hit.line, note: entityName },
        ],
        confidence: 'medium',
        rule: 'ent-symbol',
      };
    }

    return {
      id,
      idType,
      intent: ctx.intents.get(id) ?? 'Draft',
      reality: 'NotBuilt',
      evidence: [
        { kind: 'symbol-missing', note: entityName },
      ],
      confidence: 'medium',
      rule: 'ent-symbol',
    };
  },
};
