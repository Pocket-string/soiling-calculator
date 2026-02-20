import { getScoreTier, SCORE_TIER_COLORS } from '../services/leadScorer'

interface Props {
  score: number
}

export function ScoreBadge({ score }: Props) {
  const tier = getScoreTier(score)
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${SCORE_TIER_COLORS[tier]}`}
    >
      {score}
    </span>
  )
}
