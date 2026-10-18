import { useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { t } from "../theme";

const BONUS_TIERS = [
  { limit: 60, points: 300 },
  { limit: 300, points: 200 },
  { limit: 600, points: 75 },
  { limit: 1800, points: 25 },
];

function clock(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function BonusCountdown({ startedAt }) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!startedAt) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;
  // Match the server's rounded elapsed time when showing bonus cutoffs.
  const elapsed = Math.max(0, Math.round((now - startedAt) / 1000));
  const tier = BONUS_TIERS.find(({ limit }) => elapsed < limit);
  const remaining = tier ? tier.limit - elapsed : 0;

  return (
    <Box position="absolute" top="50%" right={1} transform="translateY(-50%)" whiteSpace="nowrap" aria-label="Time bonus countdown">
      <Text as="span" role="timer" aria-live="off" color={t.muted}
        fontFamily="monospace" fontSize="xs" fontVariantNumeric="tabular-nums">
        {tier ? `${clock(remaining)} to +${tier.points}` : "no time bonus"}
      </Text>
    </Box>
  );
}
