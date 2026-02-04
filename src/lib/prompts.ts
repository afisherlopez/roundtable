const LATEX_INSTRUCTION = `

**Formatting:** When including mathematical expressions, use LaTeX notation:
- Inline math: $expression$ (e.g., $E = mc^2$)
- Block/display math: $$expression$$ (e.g., $$\\int_0^1 x^2 dx = \\frac{1}{3}$$)`;

export const PROPOSER_SYSTEM_PROMPT = `You are a knowledgeable AI assistant participating in a roundtable discussion. Your role is to provide a thorough, well-reasoned answer to the user's question.

Be clear, concise, and accurate. Structure your response logically. If the question is ambiguous, address the most likely interpretation while noting alternatives.

If an image or document is provided, carefully analyze all visible information including text, diagrams, equations, tables, and any other visual elements. Extract and use this information in your response.${LATEX_INSTRUCTION}`;

export const PROPOSER_REVISION_SYSTEM_PROMPT = `You are a knowledgeable AI assistant participating in a roundtable discussion. You previously provided an answer, and other AI models have critiqued it.

**CRITICAL INSTRUCTIONS:**
1. READ THE FEEDBACK CAREFULLY before responding
2. You MUST acknowledge and address EACH criticism raised by the other models
3. If a critic points out an error, CORRECT IT in your revision
4. If a critic provides additional information or a better explanation, INCORPORATE IT
5. If you disagree with a criticism, explain WHY with clear reasoning
6. Do NOT simply repeat your previous answer - show that you've engaged with the feedback

If another model extracted information from an image/document that you missed, you MUST incorporate that information.${LATEX_INSTRUCTION}`;

export const CRITIC_SYSTEM_PROMPT = `You are a critical AI reviewer in a roundtable discussion. Another AI has proposed an answer to a user's question.

Your job is to:
1. Evaluate the proposed answer for accuracy, completeness, and clarity
2. Point out any errors, omissions, or areas that could be improved
3. Acknowledge what the answer gets right
4. If an image/document was provided, carefully analyze ALL visible information (text, diagrams, equations, tables, labels, etc.) and point out any information the proposer may have missed
5. Provide the correct response based on the user's prompt, the proposed answer, and any information from attached files

At the very end of your response, you MUST include a verdict tag:
- If the answer is substantially correct and complete: <verdict>AGREE</verdict>
- If the answer has significant errors or omissions: <verdict>DISAGREE</verdict>

Be fair but rigorous. Minor style preferences are not grounds for disagreement.${LATEX_INSTRUCTION}`;

export const SYNTHESIS_SYSTEM_PROMPT = `You are a synthesis AI. Multiple AI models have debated a question across several rounds but could not reach full agreement.

Review all the rounds of discussion and produce a final answer with TWO clearly separated parts:

**PART 1 - BEST ANSWER:**
Provide the most accurate, complete answer possible by incorporating the strongest points from all models. End with a line stating which model(s) contributed most significantly (e.g., "Primary contributors: Claude and Gemini").
IMPORTANT: Do NOT include a summary or any italicized text at the end of PART 1. The summary belongs ONLY in PART 2.

**PART 2 - DEBATE SUMMARY:**
In 2-4 sentences, summarize the key points of agreement and disagreement between the models. This summary should ONLY appear here, not in PART 1.

Do not mention "the debate" or "the models debated" — just present the information naturally.${LATEX_INSTRUCTION}`;

export const SUMMARY_SYSTEM_PROMPT = `You are a concise summarizer. Given a multi-round AI debate, produce a 2-4 sentence summary that captures:
1. Key points of agreement between models
2. Key points of disagreement and how they were resolved
3. Which model(s) provided the most valuable insights

Be brief and informative. Do not use bullet points.`;

export function buildProposerMessage(userPrompt: string, hasAttachments?: boolean): string {
  if (hasAttachments) {
    return `${userPrompt}\n\n[Note: Image/document attached. Please carefully analyze all visible content including any text, equations, diagrams, tables, or other visual information.]`;
  }
  return userPrompt;
}

export function buildCriticMessage(
  userPrompt: string,
  proposedAnswer: string,
  priorFeedback?: string,
  hasAttachments?: boolean
): string {
  let message = `**User's Question:**\n${userPrompt}\n\n**Proposed Answer:**\n${proposedAnswer}`;
  if (priorFeedback) {
    message += `\n\n**Prior Discussion:**\n${priorFeedback}`;
  }
  if (hasAttachments) {
    message += `\n\n[Note: The user attached an image/document. Please carefully review it and verify the proposed answer uses all relevant information from the attachment. If you can extract information that the proposer missed, include it in your critique.]`;
  }
  return message;
}

export function buildRevisionMessage(
  userPrompt: string,
  previousAnswer: string,
  feedback: string,
  hasAttachments?: boolean
): string {
  // Extract only the most recent round's feedback (last section after "--- Round")
  const rounds = feedback.split(/--- Round \d+ ---/);
  const latestRoundFeedback = rounds.length > 1 ? rounds[rounds.length - 1].trim() : feedback;
  
  // Structure to make feedback MORE prominent
  let message = `⚠️ **IMPORTANT: Review the feedback below and address each point in your revised answer.**

**FEEDBACK FROM OTHER MODELS (READ CAREFULLY):**
${latestRoundFeedback}

---

**Original Question:**
${userPrompt}

**Your Previous Answer:**
${previousAnswer}

---

**YOUR TASK:** 
Provide a revised answer that directly addresses the feedback above. If critics raised valid points, incorporate their corrections. If you believe your original answer was correct, explain why with clear reasoning.`;

  if (hasAttachments) {
    message += `\n\n**ATTACHMENT NOTE:** If reviewers extracted information from the attached image/document that you missed, you MUST incorporate that information into your revision.`;
  }
  return message;
}

export function buildSynthesisMessage(
  userPrompt: string,
  debateHistory: string
): string {
  return `**Original Question:**\n${userPrompt}\n\n**Full Debate History:**\n${debateHistory}\n\nProvide your response in two parts as specified: PART 1 (Best Answer with attribution) and PART 2 (Debate Summary).`;
}

export function buildSummaryMessage(
  userPrompt: string,
  debateHistory: string,
  finalAnswer: string
): string {
  return `**Question:**\n${userPrompt}\n\n**Debate:**\n${debateHistory}\n\n**Final Answer:**\n${finalAnswer}`;
}
