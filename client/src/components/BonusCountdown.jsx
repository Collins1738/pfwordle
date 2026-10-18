import { useEffect, useState } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { t } from "../theme";

const BONUS_TIERS = [
  { limit: 60, points: 300, label: "1 min" },
  { limit: 300, points: 200, label: "5 min" },
  { limit: 600, points: 75, label: "10 min" },
  { limit: 1800, points: 25, label: "30 min" },
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
  // The server rounds elapsed seconds when it scores a completed game.
  const elapsed = Math.max(0, Math.round((now - startedAt) / 1000));
  const tier = BONUS_TIERS.find(({ limit }) => elapsed < limit);
  const remaining = tier ? tier.limit - elapsed : 0;

  return (
    <Box aria-label="Time bonus countdown" w="100%" maxW="440px" mb={2} px={3} py={2}
      bg={t.surface} border={`1px solid ${t.border}`} borderRadius="10px" textAlign="center">
      <HStack justify="space-between" gap={2}>
        <Text color={t.muted} fontFamily="monospace" fontSize="xs" fontWeight="700" whiteSpace="nowrap">
          Elapsed {clock(elapsed)}
        </Text>
        <Text role="timer" aria-live="off" color={tier ? t.accent : t.muted}
          fontFamily="monospace" fontSize="lg" fontWeight="800" lineHeight="1" fontVariantNumeric="tabular-nums">
          {clock(remaining)}
        </Text>
        <Text color={t.text} fontSize="xs" fontWeight="700" textAlign="right">
          {tier ? `+${tier.points} bonus` : "No time bonus"}
        </Text>
      </HStack>
      <Text mt={1} color={t.muted} fontSize="10px">
        {tier ? `Until the ${tier.label} bonus expires` : "Keep guessing, your game is still active"}
      </Text>
    </Box>
  );
}
