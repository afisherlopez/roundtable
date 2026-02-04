export function parseVerdict(
  content: string
): 'AGREE' | 'DISAGREE' | null {
  const match = content.match(/<verdict>(AGREE|DISAGREE)<\/verdict>/i);
  if (!match) return null;
  return match[1].toUpperCase() as 'AGREE' | 'DISAGREE';
}
