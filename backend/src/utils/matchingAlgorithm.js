const surveyQuestions = require('./surveyQuestions');

// Dealbreaker questions that must match
const DEALBREAKER_QUESTIONS = {
  // Gender preference
  99: true, // Would be a custom field added later

  // Children
  58: true,

  // Kashrut standards
  9: true,
  10: true,
};

// Category weights
const CATEGORY_WEIGHTS = {
  'religious_practice': 0.25, // Questions 1-14
  'hashkafa': 0.25, // Questions 15-26
  'family_vision': 0.20, // Questions 51-60
  'communication': 0.15, // Selected questions from lifestyle
  'lifestyle': 0.10, // Questions 39-50
  'career': 0.05, // Questions 27-38
};

// Map questions to categories
const QUESTION_CATEGORIES = {
  1: 'religious_practice',
  2: 'religious_practice',
  3: 'religious_practice',
  4: 'religious_practice',
  5: 'religious_practice',
  6: 'religious_practice',
  7: 'religious_practice',
  8: 'religious_practice',
  9: 'religious_practice',
  10: 'religious_practice',
  11: 'religious_practice',
  12: 'religious_practice',
  13: 'religious_practice',
  14: 'religious_practice',
  15: 'hashkafa',
  16: 'hashkafa',
  17: 'hashkafa',
  18: 'hashkafa',
  19: 'hashkafa',
  20: 'hashkafa',
  21: 'hashkafa',
  22: 'hashkafa',
  23: 'hashkafa',
  24: 'hashkafa',
  25: 'hashkafa',
  26: 'hashkafa',
  27: 'career',
  28: 'career',
  29: 'career',
  30: 'career',
  31: 'career',
  32: 'career',
  33: 'career',
  34: 'career',
  35: 'career',
  36: 'career',
  37: 'career',
  38: 'career',
  39: 'lifestyle',
  40: 'lifestyle',
  41: 'lifestyle',
  42: 'lifestyle',
  43: 'lifestyle',
  44: 'lifestyle',
  45: 'lifestyle',
  46: 'communication',
  47: 'lifestyle',
  48: 'lifestyle',
  49: 'communication',
  50: 'communication',
  51: 'family_vision',
  52: 'family_vision',
  53: 'family_vision',
  54: 'communication',
  55: 'communication',
  56: 'family_vision',
  57: 'family_vision',
  58: 'family_vision',
  59: 'family_vision',
  60: 'family_vision',
  61: 'lifestyle',
  62: 'lifestyle',
  63: 'lifestyle',
  64: 'lifestyle',
  65: 'family_vision',
  66: 'lifestyle',
};

// Compatibility function for different question types
function calculateCompatibility(answer1, answer2, questionId) {
  const question = findQuestion(questionId);
  if (!question) return 0.5;

  // Both must answer
  if (!answer1 || !answer2) return 0;

  switch (question.type) {
    case 'likert':
      return calculateLikertCompatibility(answer1, answer2, question.scale);
    case 'enum':
      return answer1 === answer2 ? 1 : 0;
    case 'multiselect':
      return calculateMultiselectCompatibility(answer1, answer2);
    case 'text':
      return 0.5; // Text answers are hard to match algorithmically
    default:
      return 0.5;
  }
}

function calculateLikertCompatibility(val1, val2, scale = 7) {
  const distance = Math.abs(val1 - val2);
  return 1 - distance / (scale - 1);
}

function calculateMultiselectCompatibility(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return 0;

  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  // Jaccard similarity: |intersection| / |union|
  const intersection = [...set1].filter(x => set2.has(x)).length;
  const union = new Set([...set1, ...set2]).size;

  if (union === 0) return 0;
  return intersection / union;
}

function findQuestion(questionId) {
  for (let section = 1; section <= 6; section++) {
    const question = surveyQuestions[section].questions.find(q => q.id === questionId);
    if (question) return question;
  }
  return null;
}

// Main matching function
function calculateMatchScore(user1Responses, user2Responses, user1Profile, user2Profile) {
  // Tier 1: Check dealbreakers
  const dealbreakersPass = checkDealbreakers(user1Responses, user2Responses, user1Profile, user2Profile);
  if (!dealbreakersPass) {
    return { score: 0, reason: 'Dealbreaker mismatch' };
  }

  // Tier 2: Calculate compatibility scores by category
  const categoryScores = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;

  Object.entries(CATEGORY_WEIGHTS).forEach(([category, weight]) => {
    const score = calculateCategoryScore(category, user1Responses, user2Responses);
    categoryScores[category] = score;
    totalWeightedScore += score * weight;
    totalWeight += weight;
  });

  const finalScore = totalWeightedScore / totalWeight;

  return {
    score: finalScore,
    categoryScores,
    reason: 'Compatible match',
  };
}

function checkDealbreakers(user1Responses, user2Responses, user1Profile, user2Profile) {
  // Location radius check
  if (user1Profile.location_radius && user2Profile.location_radius) {
    // This would require calculating distance between locations
    // For now, assume compatible if both profiles exist
  }

  // Check specific dealbreaker questions
  for (const [questionId, isBreaker] of Object.entries(DEALBREAKER_QUESTIONS)) {
    if (!isBreaker) continue;

    const qId = parseInt(questionId);
    const section = Math.ceil(qId / 14); // Approximate section

    const answer1 = user1Responses[section]?.[qId];
    const answer2 = user2Responses[section]?.[qId];

    if (!answer1 || !answer2) continue;

    // Check importance weights - if both marked as dealbreaker
    const importance1 = answer1.importance_weight;
    const importance2 = answer2.importance_weight;

    if (importance1 === 'dealbreaker' || importance2 === 'dealbreaker') {
      // For enum questions, must match exactly
      const question = findQuestion(qId);
      if (question?.type === 'enum') {
        if (answer1.value !== answer2.value) {
          return false;
        }
      }
    }
  }

  return true;
}

function calculateCategoryScore(category, user1Responses, user2Responses) {
  const questions = Object.entries(QUESTION_CATEGORIES)
    .filter(([, cat]) => cat === category)
    .map(([qId]) => parseInt(qId));

  if (questions.length === 0) return 0.5;

  let totalCompatibility = 0;
  let totalWeight = 0;
  let answeredQuestions = 0;

  questions.forEach(questionId => {
    const section = findQuestionSection(questionId);
    const answer1 = user1Responses[section]?.[questionId];
    const answer2 = user2Responses[section]?.[questionId];

    if (!answer1 || !answer2) return;

    // Calculate mutual importance weight
    const importance1 = getImportanceWeight(answer1.importance_weight);
    const importance2 = getImportanceWeight(answer2.importance_weight);
    const mutualImportance = Math.sqrt(importance1 * importance2);

    // Calculate compatibility
    const compatibility = calculateCompatibility(
      answer1.value,
      answer2.value,
      questionId
    );

    totalCompatibility += compatibility * mutualImportance;
    totalWeight += mutualImportance;
    answeredQuestions++;
  });

  if (answeredQuestions === 0) return 0.5;
  return totalCompatibility / totalWeight;
}

function getImportanceWeight(importance) {
  const weights = {
    'not_important': 0.25,
    'somewhat': 0.5,
    'important': 0.75,
    'dealbreaker': 1.0,
  };
  return weights[importance] || 0.5;
}

function findQuestionSection(questionId) {
  for (let section = 1; section <= 6; section++) {
    const found = surveyQuestions[section].questions.some(q => q.id === questionId);
    if (found) return section;
  }
  return 1;
}

module.exports = {
  calculateMatchScore,
  checkDealbreakers,
  calculateCategoryScore,
  CATEGORY_WEIGHTS,
  QUESTION_CATEGORIES,
};
