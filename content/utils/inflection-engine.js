/**
 * LanguageBridge Inflection Engine
 */

class LanguageBridgeInflectionEngine {
  // Irregular past tense mappings (98 common verbs)
  static irregularPastTense = {
    'get': 'got', 'go': 'went', 'have': 'had', 'make': 'made', 'take': 'took',
    'give': 'gave', 'see': 'saw', 'come': 'came', 'think': 'thought', 'know': 'knew',
    'find': 'found', 'say': 'said', 'tell': 'told', 'leave': 'left', 'keep': 'kept',
    'feel': 'felt', 'bring': 'brought', 'buy': 'bought', 'build': 'built', 'send': 'sent',
    'spend': 'spent', 'teach': 'taught', 'catch': 'caught', 'fight': 'fought',
    'begin': 'began', 'understand': 'understood', 'show': 'showed', 'draw': 'drew',
    'eat': 'ate', 'fall': 'fell', 'grow': 'grew', 'hold': 'held', 'hear': 'heard',
    'lose': 'lost', 'meet': 'met', 'pay': 'paid', 'read': 'read', 'run': 'ran',
    'sell': 'sold', 'sit': 'sat', 'stand': 'stood', 'throw': 'threw', 'win': 'won',
    'write': 'wrote', 'speak': 'spoke', 'break': 'broke', 'choose': 'chose',
    'drive': 'drove', 'forget': 'forgot', 'freeze': 'froze',
    'ride': 'rode', 'rise': 'rose', 'shake': 'shook', 'sing': 'sang',
    'swim': 'swam', 'wake': 'woke', 'wear': 'wore'
  };

  // Irregular third person singular mappings
  static irregularThirdPerson = {
    'have': 'has',
    'go': 'goes',
    'do': 'does'
  };

  // Irregular progressive form mappings
  static irregularProgressive = {
    'lie': 'lying',
    'die': 'dying',
    'tie': 'tying'
  };
  static doNotDouble = [
    'enter', 'order', 'offer', 'suffer', 'differ', 'gather', 'filter',
    'consider', 'remember', 'deliver', 'cover', 'discover', 'recover',
    'answer', 'happen', 'open', 'listen'
  ];
  static matchInflection(original, baseWord, replacement) {
    const orig = original.toLowerCase();
    const base = baseWord.toLowerCase();
    const isCapitalized = original[0] === original[0].toUpperCase();
    const isAllCaps = original === original.toUpperCase();

    let result = replacement;

    // Match tense/form
    if (orig.endsWith('ing')) {
      result = this.getProgressive(replacement);
    } else if (orig.endsWith('ed') && !orig.endsWith('ied')) {
      result = this.getPastTense(replacement);
    } else if (orig.endsWith('ied') && base.endsWith('y')) {
      result = this.getPastTense(replacement);
    } else if (orig.endsWith('ies') && base.endsWith('y')) {
      result = this.getThirdPerson(replacement);
    } else if (orig.endsWith('s') && !base.endsWith('s') && !orig.endsWith('ss')) {
      if (replacement.endsWith('s')) {
        result = replacement; // Already plural
      } else {
        result = this.getThirdPerson(replacement);
      }
    }

    // Match capitalization
    if (isAllCaps) {
      result = result.toUpperCase();
    } else if (isCapitalized) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }

    return result;
  }
  static getPastTense(word) {
    if (this.irregularPastTense[word]) return this.irregularPastTense[word];
    if (word.endsWith('e')) return word + 'd';
    if (word.endsWith('y') && !'aeiou'.includes(word[word.length - 2])) {
      return word.slice(0, -1) + 'ied';
    }
    return word + 'ed';
  }
  static getThirdPerson(word) {
    if (this.irregularThirdPerson[word]) return this.irregularThirdPerson[word];

    if (word.endsWith('ss') || word.endsWith('sh') || word.endsWith('ch') ||
        word.endsWith('x') || word.endsWith('z')) {
      return word + 'es';
    }

    if (word.endsWith('o') && word.length > 1 && !'aeiou'.includes(word[word.length - 2])) {
      return word + 'es';
    }

    if (word.endsWith('y') && !'aeiou'.includes(word[word.length - 2])) {
      return word.slice(0, -1) + 'ies';
    }

    return word + 's';
  }
  static getProgressive(word) {
    if (this.irregularProgressive[word]) return this.irregularProgressive[word];

    if (word.endsWith('e') && !word.endsWith('ee')) {
      return word.slice(0, -1) + 'ing';
    }

    // Consonant doubling for short words (CVC pattern)
    if (!this.doNotDouble.includes(word) &&
        word.length <= 4 &&
        word.length >= 3 &&
        !'aeiou'.includes(word[word.length - 1]) &&
        'aeiou'.includes(word[word.length - 2]) &&
        !'aeiou'.includes(word[word.length - 3])) {
      return word + word[word.length - 1] + 'ing';
    }

    return word + 'ing';
  }
  static createFlexiblePattern(baseWord) {
    const forms = new Set([
      baseWord,
      baseWord + 's',
      baseWord + 'd',
      baseWord + 'ed',
      baseWord + 'ing'
    ]);

    // Handle words ending in 'e'
    if (baseWord.endsWith('e')) {
      forms.add(baseWord.slice(0, -1) + 'ed');
      forms.add(baseWord.slice(0, -1) + 'ing');
    }

    // Handle words ending in 'y'
    if (baseWord.endsWith('y') && baseWord.length > 2) {
      const beforeY = baseWord[baseWord.length - 2];
      if (!'aeiou'.includes(beforeY)) {
        forms.add(baseWord.slice(0, -1) + 'ied');
        forms.add(baseWord.slice(0, -1) + 'ies');
      }
    }

    // Handle consonant doubling
    if (baseWord.length > 3 &&
        !'aeiou'.includes(baseWord[baseWord.length - 1]) &&
        'aeiou'.includes(baseWord[baseWord.length - 2])) {
      const lastChar = baseWord[baseWord.length - 1];
      forms.add(baseWord + lastChar + 'ed');
      forms.add(baseWord + lastChar + 'ing');
    }

    const formsArray = Array.from(forms);
    return '\\b(' + formsArray.join('|') + ')\\b';
  }
  static stemWord(word) {
    let stemmed = word.toLowerCase();

    stemmed = stemmed
      .replace(/ies$/, 'y')
      .replace(/ied$/, 'y')
      .replace(/ing$/, '')
      .replace(/ed$/, '')
      .replace(/s$/, '');

    if (stemmed.endsWith('d') && !word.toLowerCase().endsWith('d')) {
      stemmed = stemmed.slice(0, -1);
    }

    return stemmed;
  }
}

// Export to global namespace
window.LanguageBridgeInflectionEngine = LanguageBridgeInflectionEngine;
