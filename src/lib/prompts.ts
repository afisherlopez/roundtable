export const PROPOSER_SYSTEM_PROMPT = `You are a knowledgeable AI assistant participating in a roundtable discussion. Your role is to provide a thorough, well-reasoned answer to the user's question.

Be clear, concise, and accurate. Structure your response logically. If the question is ambiguous, address the most likely interpretation while noting alternatives.`;

export const PROPOSER_REVISION_SYSTEM_PROMPT = `You are a knowledgeable AI assistant participating in a roundtable discussion. You previously provided an answer, and other AI models have given feedback.

Review their feedback carefully. If they raise valid points, revise your answer accordingly. If you believe your original answer was correct, defend your position with clear reasoning. Provide your revised (or defended) answer in full.`;

export const CRITIC_SYSTEM_PROMPT = `You are a critical AI reviewer in a roundtable discussion. Another AI has proposed an answer to a user's question.

Your job is to:
1. Evaluate the proposed answer for accuracy, completeness, and clarity
2. Point out any errors, omissions, or areas that could be improved
3. Acknowledge what the answer gets right
4. Provide a the correct response based on the user's prompt, the proposed answer, and the feedback from the other models.

At the very end of your response, you MUST include a verdict tag:
- If the answer is substantially correct and complete: <verdict>AGREE</verdict>
- If the answer has significant errors or omissions: <verdict>DISAGREE</verdict>

Be fair but rigorous. Minor style preferences are not grounds for disagreement.`;

export const SYNTHESIS_SYSTEM_PROMPT = `You are a synthesis AI. Multiple AI models have debated a question across several rounds but could not reach full agreement.

Review all the rounds of discussion and produce a final, comprehensive answer that:
1. Incorporates the strongest points from all models
2. Clearly notes where the models disagreed and why
3. Provides the most accurate and helpful answer possible

Do not mention the debate process itself — just give the best possible answer.`;

export const SUMMARY_SYSTEM_PROMPT = `You are a concise summarizer. Given a multi-round AI debate, produce a 2-4 sentence summary that captures:
1. The main question
2. Key points of agreement or disagreement
3. How the final answer was reached

Be brief and informative. Do not use bullet points.`;

export function buildProposerMessage(userPrompt: string): string {
  return userPrompt;
}

export function buildCriticMessage(
  userPrompt: string,
  proposedAnswer: string,
  priorFeedback?: string
): string {
  let message = `**User's Question:**\n${userPrompt}\n\n**Proposed Answer:**\n${proposedAnswer}`;
  if (priorFeedback) {
    message += `\n\n**Prior Discussion:**\n${priorFeedback}`;
  }
  return message;
}

export function buildRevisionMessage(
  userPrompt: string,
  previousAnswer: string,
  feedback: string
): string {
  return `**Original Question:**\n${userPrompt}\n\n**Your Previous Answer:**\n${previousAnswer}\n\n**Feedback from Reviewers:**\n${feedback}\n\nPlease provide your revised answer.`;
}

export function buildSynthesisMessage(
  userPrompt: string,
  debateHistory: string
): string {
  return `**Original Question:**\n${userPrompt}\n\n**Full Debate History:**\n${debateHistory}`;
}

export function buildSummaryMessage(
  userPrompt: string,
  debateHistory: string,
  finalAnswer: string
): string {
  return `**Question:**\n${userPrompt}\n\n**Debate:**\n${debateHistory}\n\n**Final Answer:**\n${finalAnswer}`;
}
