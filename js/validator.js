const ARROW_NAMES = [
  '->>', '-->', '<--', '->', '<-', '..>', '--|>', '<|--', '*--', '--*', 'o--', '--o', '..'
];

const SEQUENCE_ARROWS = new Set(['->>', '-->', '->', '<-', '..>']);
const CLASS_ARROWS = new Set(['-->', '..>', '--|>', '<|--', '*--', '--*', 'o--', '--o']);
const STATE_ARROWS = new Set(['-->']);
const USECASE_ARROWS = new Set(['-->', '->', '<--', '<-']);

const GLOBAL_KEYWORDS = new Set([
  '@startuml', '@enduml', 'skinparam', 'title', 'as', 'of', 'left', 'right', 'up', 'down',
  'direction', '!define', '!include', 'together',
  'start', 'stop', 'endif', 'elseif', 'endfork', 'fork', 'partition'
]);

const TYPE_KEYWORDS = {
  participant: 'sequence', actor: 'sequence', activate: 'sequence', deactivate: 'sequence',
  note: 'sequence', alt: 'sequence', else: 'sequence', opt: 'sequence', loop: 'sequence',
  group: 'sequence', end: 'sequence', if: 'sequence', then: 'sequence',
  class: 'class', interface: 'class', enum: 'class', abstract: 'class', package: 'class',
  state: 'state',
  usecase: 'usecase', rectangle: 'usecase'
};

function stripLineComments(line) {
  // Убираем блочный комментарий в одной строке и однострочный комментарий через '
  return line.replace(/\/'[^']*'\/|'.*/g, '');
}

function trimQuotes(name) {
  return name.replace(/^["'](.*)["']$/, '$1').trim();
}

function normalizeName(name) {
  return trimQuotes(name).toLowerCase();
}

function findArrow(line) {
  let best = null;
  for (const arrow of ARROW_NAMES) {
    const idx = line.indexOf(arrow);
    if (idx === -1) continue;
    if (!best || idx < best.index) {
      best = { index: idx, arrow, length: arrow.length };
    }
  }
  return best;
}

function inferType(line, currentType) {
  const lowered = line.toLowerCase();

  // Сильные маркеры типов перекрывают sequence, т.к. actor/participant встречаются и в usecase
  if (/\bstate\b/.test(lowered) || /\[\*\]/.test(line)) return 'state';
  if (/\b(?:class|interface|enum|abstract)\b/.test(lowered)) return 'class';
  if (/\b(?:usecase|rectangle)\b/.test(lowered)) return 'usecase';

  if (currentType) return currentType;

  if (/\b(?:participant|actor|activate|deactivate|alt|opt|loop|group|end)\b/.test(lowered)) {
    return 'sequence';
  }
  return currentType;
}

export class PlantUMLValidator {
  parse(code) {
    const rawLines = code.split(/\r?\n/);
    const ast = {
      type: null,
      declarations: new Map(),
      relations: [],
      messages: [],
      errors: [],
      rawLines,
      raw: code
    };

    let hasStart = false;
    let hasEnd = false;

    for (let i = 0; i < rawLines.length; i++) {
      const clean = stripLineComments(rawLines[i]).trim();
      if (!clean) continue;

      if (clean.toLowerCase().startsWith('@startuml')) {
        hasStart = true;
        ast.type = ast.type || inferType(clean, ast.type);
        continue;
      }
      if (clean.toLowerCase().startsWith('@enduml')) {
        hasEnd = true;
        continue;
      }

      if (!hasStart) {
        ast.errors.push({ line: i + 1, message: 'Код должен начинаться с @startuml' });
        break;
      }

      ast.type = inferType(clean, ast.type);
      this.parseLine(clean, i + 1, ast);
    }

    if (!hasStart) {
      ast.errors.push({ line: 1, message: 'Отсутствует @startuml' });
    } else if (!hasEnd) {
      ast.errors.push({ line: rawLines.length || 1, message: 'Отсутствует @enduml' });
    }

    this.checkNesting(rawLines, ast);
    this.checkArrows(ast);
    return ast;
  }

  parseLine(line, lineNo, ast) {
    const lowered = line.toLowerCase();

    // participant / actor
    const partMatch = line.match(/^(participant|actor)\s+(?:"([^"]+)"|(\S+))(?:\s+as\s+(\S+))?$/i);
    if (partMatch) {
      const display = partMatch[2] || partMatch[3];
      const alias = partMatch[4] || display;
      ast.declarations.set(normalizeName(alias), {
        kind: partMatch[1].toLowerCase(),
        display,
        alias,
        line: lineNo
      });
      return;
    }

    // class / interface / enum
    const classMatch = line.match(/^(class|interface|enum)\s+(\S+)(?:\s*\{)?/i);
    if (classMatch) {
      ast.declarations.set(normalizeName(classMatch[2]), {
        kind: classMatch[1].toLowerCase(),
        display: classMatch[2],
        line: lineNo
      });
      return;
    }

    // state
    const stateMatch = line.match(/^state\s+(?:"([^"]+)"|(\S+))(?:\s+as\s+(\S+))?$/i);
    if (stateMatch) {
      const display = stateMatch[1] || stateMatch[2];
      const alias = stateMatch[3] || display;
      ast.declarations.set(normalizeName(alias), {
        kind: 'state',
        display,
        alias,
        line: lineNo
      });
      return;
    }

    // usecase (View Menu) as VM
    const ucMatch = line.match(/^\(\s*([^)]+)\s*\)(?:\s+as\s+(\S+))?$/i);
    if (ucMatch) {
      const display = ucMatch[1];
      const alias = ucMatch[2] || display;
      ast.declarations.set(normalizeName(alias), {
        kind: 'usecase',
        display,
        alias,
        line: lineNo
      });
      return;
    }

    // arrows / messages / relations
    const arrowInfo = findArrow(line);
    if (arrowInfo) {
      const left = parseEndpoint(line.slice(0, arrowInfo.index));
      let right = parseEndpoint(line.slice(arrowInfo.index + arrowInfo.length));
      let label = '';

      function parseEndpoint(str) {
        const isMultiplicity = (s) => /^[0-9.*\.\s]+$/.test(s.trim());
        let s = str.trim();
        const leading = s.match(/^"(.+?)"\s+(.*)$/);
        if (leading && isMultiplicity(leading[1])) s = leading[2];
        const trailing = s.match(/^(.*)\s+"(.+?)"$/);
        if (trailing && isMultiplicity(trailing[2])) s = trailing[1];
        return s.trim();
      }
      const colon = right.indexOf(':');
      if (colon !== -1) {
        label = right.slice(colon + 1).trim();
        right = right.slice(0, colon).trim();
      }

      const rec = {
        from: left,
        to: right,
        arrow: arrowInfo.arrow,
        label,
        line: lineNo
      };

      if (ast.type === 'sequence' || ast.type === 'usecase' || ast.type === null) {
        ast.messages.push(rec);
      } else {
        ast.relations.push(rec);
      }
      return;
    }

    // one-word keywords: activate, deactivate, end, together, left/right/etc
    const oneWord = line.match(/^([a-z_]+)/i)?.[1].toLowerCase();
    if (oneWord && (GLOBAL_KEYWORDS.has(oneWord) || TYPE_KEYWORDS[oneWord])) return;

    // unknown line? skip silently — будет проверено синтаксически
  }

  checkNesting(rawLines, ast) {
    let braceDepth = 0;
    const stack = [];
    const blockOpeners = /^(alt|opt|loop|group|if)\b/i;

    for (let i = 0; i < rawLines.length; i++) {
      const line = stripLineComments(rawLines[i]).trim();
      if (!line) continue;

      const openMatch = line.match(blockOpeners);
      if (openMatch) {
        stack.push(openMatch[1].toLowerCase());
      } else if (/^else\b/i.test(line)) {
        const top = stack[stack.length - 1];
        if (top !== 'alt' && top !== 'if') {
          ast.errors.push({ line: i + 1, message: 'Ключевое слово else может находиться только внутри alt/if' });
        }
      } else if (/^end\b/i.test(line)) {
        if (!stack.length) {
          ast.errors.push({ line: i + 1, message: 'Лишнее ключевое слово end' });
        } else {
          stack.pop();
        }
      }

      braceDepth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    }

    if (braceDepth !== 0) {
      ast.errors.push({ line: rawLines.length || 1, message: 'Несбалансированы фигурные скобки { }' });
    }
    if (stack.length) {
      ast.errors.push({ line: rawLines.length || 1, message: `Не закрыт блок: ${stack.join(', ')}` });
    }
  }

  checkArrows(ast) {
    const allowedSet =
      ast.type === 'sequence'
        ? SEQUENCE_ARROWS
        : ast.type === 'class'
        ? CLASS_ARROWS
        : ast.type === 'state'
        ? STATE_ARROWS
        : ast.type === 'usecase'
        ? USECASE_ARROWS
        : null;

    if (!allowedSet) return;

    const allEdges = [...ast.messages, ...ast.relations];
    for (const edge of allEdges) {
      if (!allowedSet.has(edge.arrow)) {
        ast.errors.push({
          line: edge.line,
          message: `Стрелка ${edge.arrow} не подходит для диаграммы типа ${ast.type}`
        });
      }
    }
  }

  validateSyntax(ast, expectedType) {
    const errors = [...ast.errors];

    if (expectedType && ast.type && ast.type !== expectedType) {
      errors.push({
        line: 1,
        message: `Ожидалась диаграмма типа ${expectedType}, но код похож на ${ast.type}`
      });
    }

    // Проверка известных ключевых слов
    for (const line of ast.rawLines) {
      const clean = stripLineComments(line).trim();
      if (!clean || clean.startsWith('@')) continue;
      if (findArrow(clean)) continue;

      const token = clean.match(/^([a-z_]+)\b/i)?.[1].toLowerCase();
      if (!token) continue;
      if (
        GLOBAL_KEYWORDS.has(token) ||
        TYPE_KEYWORDS[token] ||
        ['package', 'rectangle'].includes(token)
      ) {
        continue;
      }
      // Если слово не является именем участника/класса рядом с {, — это может быть допустимая строка
      // Для простоты пропускаем одна строка с телом класса, например "id : int"
      if (/^\S+\s*:/.test(clean)) continue;
    }

    return errors;
  }

  buildAliasMap(ast) {
    const map = new Map();
    for (const [key, decl] of ast.declarations) {
      map.set(key, key);
      const displayNorm = normalizeName(decl.display);
      if (decl.alias) {
        map.set(normalizeName(decl.alias), key);
      }
      if (!map.has(displayNorm)) map.set(displayNorm, key);
    }
    // Добавим имена, встречающиеся как endpoints, для нормализации
    const collect = (name) => {
      const norm = normalizeName(name);
      if (!map.has(norm)) map.set(norm, norm);
    };
    [...ast.messages, ...ast.relations].forEach((e) => {
      collect(e.from);
      collect(e.to);
    });
    return map;
  }

  normalizeEdge(edge, aliasMap) {
    const from = aliasMap.get(normalizeName(edge.from)) || normalizeName(edge.from);
    const to = aliasMap.get(normalizeName(edge.to)) || normalizeName(edge.to);
    const label = edge.label.toLowerCase().replace(/\s+/g, ' ').trim();
    return { from, to, arrow: edge.arrow, label };
  }

  normalizeAST(ast) {
    const aliasMap = this.buildAliasMap(ast);
    const messages = ast.messages.map((m) => this.normalizeEdge(m, aliasMap));
    const relations = ast.relations.map((r) => this.normalizeEdge(r, aliasMap));
    const participants = new Set();
    [...ast.messages, ...ast.relations].forEach((e) => {
      participants.add(aliasMap.get(normalizeName(e.from)) || normalizeName(e.from));
      participants.add(aliasMap.get(normalizeName(e.to)) || normalizeName(e.to));
    });
    return { type: ast.type, participants, messages, relations, declarations: new Set(ast.declarations.keys()) };
  }

  compareSemantic(userAST, expectedAST) {
    const u = this.normalizeAST(userAST);
    const e = this.normalizeAST(expectedAST);
    const differences = [];

    if (u.type && e.type && u.type !== e.type) {
      differences.push({ kind: 'type', expected: e.type, actual: u.type });
      return { match: false, differences };
    }

    // Порядок не важен: сравниваем как множества
    const participantDiff = this.setDiff(u.participants, e.participants, 'элемент');
    differences.push(...participantDiff);

    if (u.type === 'class' || u.type === 'state') {
      const relDiff = this.edgeListDiff(u.relations, e.relations, 'связь');
      differences.push(...relDiff);
    } else {
      const msgDiff = this.edgeListDiff(u.messages, e.messages, 'сообщение');
      differences.push(...msgDiff);
    }

    return {
      match: differences.length === 0,
      differences
    };
  }

  setDiff(actual, expected, label) {
    const diffs = [];
    for (const item of expected) {
      if (!actual.has(item)) diffs.push({ kind: 'missing', expected: `${label}: ${item}`, actual: null });
    }
    for (const item of actual) {
      if (!expected.has(item)) diffs.push({ kind: 'extra', expected: null, actual: `${label}: ${item}` });
    }
    return diffs;
  }

  edgeListDiff(actual, expected, label) {
    const serialize = (edge) => `${edge.from} ${edge.arrow} ${edge.to}${edge.label ? ' : ' + edge.label : ''}`;
    const expectedSet = expected.map(serialize);
    const actualSet = actual.map(serialize);
    const diffs = [];

    expectedSet.forEach((exp, idx) => {
      if (!actualSet.includes(exp)) {
        diffs.push({ kind: 'missing', expected: `${label}: ${exp}`, actual: null });
      }
    });

    actualSet.forEach((act) => {
      if (!expectedSet.includes(act)) {
        diffs.push({ kind: 'extra', expected: null, actual: `${label}: ${act}` });
      }
    });

    return diffs;
  }

  checkActivations(ast) {
    // Заглушка для будущего расширения
    return [];
  }

  checkNestingPublic(ast) {
    return this.checkNesting(ast.rawLines, ast);
  }
}
